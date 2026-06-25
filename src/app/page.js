'use client';

import { useState, useEffect, useCallback } from 'react';
import DayCard from './components/DayCard/DayCard';
import StatsBar from './components/StatsBar/StatsBar';
import FilterBar from './components/FilterBar/FilterBar';
import { getEditToken, setEditToken, clearEditToken, verifyEditToken } from '../lib/auth';

const START_DATE = new Date('2026-06-14');
const TOTAL_DAYS = 45;

function generateDays() {
  return Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const date = new Date(START_DATE);
    date.setDate(START_DATE.getDate() + i);
    return {
      id: i + 1,
      date: date.toISOString().split('T')[0],
      topics: [],
    };
  });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedDay, setExpandedDay] = useState(null);

  // Edit-lock state
  const [isEditor, setIsEditor] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  // ── Load from server on mount ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/progress');
        const json = await res.json();
        if (json.days && json.days.length > 0) {
          setDays(json.days);
        } else {
          // First-ever load: seed with empty days. This will get saved
          // once an editor makes a change (or you can save immediately
          // below if you want it persisted right away).
          setDays(generateDays());
        }
      } catch (err) {
        console.error('Failed to load progress:', err);
        setError('Could not load progress from the server.');
        setDays(generateDays());
      } finally {
        setLoading(false);
      }
    })();

    // Auto-expand today
    const today = new Date().toISOString().split('T')[0];
    const todayIdx = generateDays().findIndex(d => d.date === today);
    if (todayIdx !== -1) setExpandedDay(todayIdx + 1);

    // Restore edit token if present (we trust it optimistically; any
    // write will fail server-side if it's actually wrong)
    if (getEditToken()) setIsEditor(true);
  }, []);

  // ── Save to server (debounced-ish: fires per mutation) ────────────────
  const saveDays = useCallback(async (nextDays) => {
    const token = getEditToken();
    if (!token) return; // not an editor, nothing to save

    setSaving(true);
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-edit-password': token,
        },
        body: JSON.stringify({ days: nextDays }),
      });
      if (res.status === 401) {
        // token went stale/wrong — lock editing back down
        clearEditToken();
        setIsEditor(false);
        setError('Edit session expired. Please unlock again.');
      } else if (!res.ok) {
        setError('Failed to save — your last change may not have persisted.');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Save failed:', err);
      setError('Failed to save — check your connection.');
    } finally {
      setSaving(false);
    }
  }, []);

  // Helper: update local state immediately, then persist
  const mutate = useCallback((updater) => {
    setDays(prev => {
      const next = updater(prev);
      saveDays(next);
      return next;
    });
  }, [saveDays]);

  // ── Mutation handlers (all gated implicitly — buttons are hidden/disabled
  //    for non-editors in the UI, but we double-check here too) ──────────
  const addTopic = (dayId, topic, tag) => {
    if (!isEditor) return;
    mutate(prev =>
      prev.map(d =>
        d.id === dayId
          ? { ...d, topics: [...d.topics, { id: Date.now(), text: topic, done: false, tag: tag || 'dsa' }] }
          : d
      )
    );
  };

  const toggleTopic = (dayId, topicId) => {
    if (!isEditor) return;
    mutate(prev =>
      prev.map(d =>
        d.id === dayId
          ? { ...d, topics: d.topics.map(t => t.id === topicId ? { ...t, done: !t.done } : t) }
          : d
      )
    );
  };

  const deleteTopic = (dayId, topicId) => {
    if (!isEditor) return;
    mutate(prev =>
      prev.map(d =>
        d.id === dayId
          ? { ...d, topics: d.topics.filter(t => t.id !== topicId) }
          : d
      )
    );
  };

  const editTopic = (dayId, topicId, newText) => {
    if (!isEditor) return;
    mutate(prev =>
      prev.map(d =>
        d.id === dayId
          ? { ...d, topics: d.topics.map(t => t.id === topicId ? { ...t, text: newText } : t) }
          : d
      )
    );
  };

  const updateTopicTag = (dayId, topicId, tag) => {
    if (!isEditor) return;
    mutate(prev =>
      prev.map(d =>
        d.id === dayId
          ? { ...d, topics: d.topics.map(t => t.id === topicId ? { ...t, tag } : t) }
          : d
      )
    );
  };

  const addNote = (dayId, note) => {
    if (!isEditor) return;
    mutate(prev => prev.map(d => d.id === dayId ? { ...d, note } : d));
  };

  // ── Unlock flow ─────────────────────────────────────────────────────
  const handleUnlock = async () => {
    if (!passwordInput.trim()) return;
    setUnlocking(true);
    setUnlockError('');
    try {
      const ok = await verifyEditToken(passwordInput.trim(), days);
      if (ok) {
        setEditToken(passwordInput.trim());
        setIsEditor(true);
        setShowUnlock(false);
        setPasswordInput('');
      } else {
        setUnlockError('Incorrect password.');
      }
    } catch (err) {
      setUnlockError('Could not reach server. Try again.');
    } finally {
      setUnlocking(false);
    }
  };

  const handleLock = () => {
    clearEditToken();
    setIsEditor(false);
  };

  // Stats
  const totalTopics    = days.reduce((a, d) => a + d.topics.length, 0);
  const doneTopics     = days.reduce((a, d) => a + d.topics.filter(t => t.done).length, 0);
  const dsaTopics      = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'dsa').length, 0);
  const daTopics       = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'da').length, 0);
  const genaiTopics       = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'genai').length, 0);
  const backendTopics  = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'backend').length, 0);
  const coreTopics     = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'core').length, 0);
  const aptitudeTopics = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'aptitude').length, 0);

  const today = new Date().toISOString().split('T')[0];
  const daysPassed = days.filter(d => d.date < today).length;

  const filteredDays = days.filter(d => {
    const matchSearch = search
      ? d.topics.some(t => t.text.toLowerCase().includes(search.toLowerCase()))
      : true;

    if (!matchSearch) return false;

    if (filter === 'dsa')      return d.topics.some(t => t.tag === 'dsa');
    if (filter === 'da')       return d.topics.some(t => t.tag === 'da');
    if (filter === 'genai')       return d.topics.some(t => t.tag === 'genai');
    if (filter === 'backend')  return d.topics.some(t => t.tag === 'backend');
    if (filter === 'core')     return d.topics.some(t => t.tag === 'core');
    if (filter === 'aptitude') return d.topics.some(t => t.tag === 'aptitude');
    if (filter === 'pending')  return d.topics.some(t => !t.done);
    if (filter === 'today')    return d.date === today;
    if (filter === 'done')     return d.topics.length > 0 && d.topics.every(t => t.done);
    return true;
  });

  const LEGEND = [
    { label: 'DSA',      color: '#f78166' },
    { label: 'DA',       color: '#d2a8ff' },
    { label: 'GenAI',       color: '#79c0ff' },
    { label: 'Backend',  color: '#56d364' },
    { label: 'Core',     color: '#e3b341' },
    { label: 'Aptitude', color: '#ff7b72' },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0d1117] text-[#e6edf3] font-mono flex items-center justify-center">
        <p className="text-sm text-[#8b949e]">Loading progress…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#e6edf3] font-mono">
      {/* Header */}
      <div className="border-b border-[#21262d] px-4 py-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#58a6ff]">
             Road to Offer
            </h1>
            <p className="text-xs text-[#8b949e] mt-0.5">
              14 Jun → 28 Jul 2026 &nbsp;·&nbsp; 45 days &nbsp;·&nbsp; Day {Math.min(daysPassed + 1, 45)} of 45
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {LEGEND.map(({ label, color }) => (
              <span
                key={label}
                className="bg-[#161b22] border border-[#21262d] px-2 py-1 rounded text-xs text-[#8b949e] flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                {label}
              </span>
            ))}

            {/* Edit lock/unlock control */}
            {isEditor ? (
              <button
                onClick={handleLock}
                className="text-xs px-2 py-1 rounded border border-[#3fb950] text-[#3fb950] hover:bg-[#3fb95015] transition-colors flex items-center gap-1"
                title="You can edit. Click to lock."
              >
                🔓 Editing
              </button>
            ) : (
              <button
                onClick={() => setShowUnlock(true)}
                className="text-xs px-2 py-1 rounded border border-[#21262d] text-[#8b949e] hover:text-[#58a6ff] hover:border-[#58a6ff] transition-colors flex items-center gap-1"
                title="Unlock editing"
              >
                🔒 View only
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unlock modal */}
      {showUnlock && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
          onClick={() => setShowUnlock(false)}
        >
          <div
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-sm font-semibold text-[#e6edf3] mb-3">Unlock editing</h2>
            <input
              type="password"
              autoFocus
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              placeholder="Edit password"
              className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-2 text-sm text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
            />
            {unlockError && <p className="text-xs text-[#f78166] mt-2">{unlockError}</p>}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleUnlock}
                disabled={unlocking}
                className="flex-1 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white text-sm rounded px-3 py-2 transition-colors"
              >
                {unlocking ? 'Checking…' : 'Unlock'}
              </button>
              <button
                onClick={() => setShowUnlock(false)}
                className="flex-1 bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] text-sm rounded px-3 py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
        {error && (
          <div className="mb-4 text-xs text-[#f78166] bg-[#f7816615] border border-[#f7816633] rounded px-3 py-2">
            {error}
          </div>
        )}
        {saving && (
          <div className="mb-4 text-xs text-[#8b949e]">Saving…</div>
        )}

        {/* Stats bar — full width on top */}
        <StatsBar
          total={totalTopics}
          done={doneTopics}
          dsa={dsaTopics}
          da={daTopics}
          genai={genaiTopics}
          backend={backendTopics}
          core={coreTopics}
          aptitude={aptitudeTopics}
          daysPassed={daysPassed}
        />

        <div className="mt-5">
          <FilterBar
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
          />
        </div>

        <div className="mt-5 space-y-2">
          {filteredDays.map(day => (
            <DayCard
              key={day.id}
              day={day}
              isToday={day.date === today}
              isEditor={isEditor}
              expanded={expandedDay === day.id}
              onToggleExpand={() =>
                setExpandedDay(expandedDay === day.id ? null : day.id)
              }
              onAddTopic={addTopic}
              onToggleTopic={toggleTopic}
              onDeleteTopic={deleteTopic}
              onEditTopic={editTopic}
              onUpdateTag={updateTopicTag}
              onAddNote={addNote}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
