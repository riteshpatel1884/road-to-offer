'use client';

import { useState, useEffect } from 'react';
import DayCard from './components/DayCard/DayCard';
import StatsBar from './components/StatsBar/StatsBar';
import FilterBar from './components/FilterBar/FilterBar';

export default function Home() {
  const [days, setDays] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedDay, setExpandedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [popup, setPopup] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin-password');
    if (saved) { setAdminPassword(saved); setIsAdmin(true); }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const openLoginModal = () => { setLoginInput(''); setLoginError(''); setShowLoginModal(true); };

  const submitLogin = async () => {
    if (!loginInput) { setLoginError('Please enter a password.'); return; }
    setLoginError(''); setLoggingIn(true);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) { setLoginError('Incorrect password. Please try again.'); setLoggingIn(false); return; }
      localStorage.setItem('admin-password', loginInput);
      setAdminPassword(loginInput); setIsAdmin(true); setShowLoginModal(false); setLoggingIn(false);
      setPopup({ title: 'Logged in', message: 'Admin mode enabled. You can now add, edit, and complete tasks.' });
    } catch { setLoginError('Something went wrong. Please try again.'); setLoggingIn(false); }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin-password');
    setAdminPassword(''); setIsAdmin(false);
    setPopup({ title: 'Logged out', message: 'You are now in view-only mode.' });
  };

  useEffect(() => {
    fetch('/api/days').then(r => r.json()).then(data => {
      setDays(data); setLoading(false);
      const today = new Date().toISOString().split('T')[0];
      const todayDay = data.find(d => d.date === today);
      if (todayDay) setExpandedDay(todayDay.id);
    });
  }, []);

  const authHeaders = () => ({ 'Content-Type': 'application/json', 'x-admin-password': adminPassword });

  const handleUnauthorized = () => {
    if (isAdmin) { localStorage.removeItem('admin-password'); setAdminPassword(''); setIsAdmin(false); }
    setPopup({ title: 'Admin login required', message: 'Only the admin can add or update tasks. Please log in with the admin password to make changes.' });
  };

  const addTopic = async (dayId, text, tag) => {
    const res = await fetch('/api/topics', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ dayId, text, tag }) });
    if (res.status === 401) return handleUnauthorized();
    const topic = await res.json();
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, topics: [...d.topics, topic] } : d));
  };

  const toggleTopic = async (dayId, topicId) => {
    const day = days.find(d => d.id === dayId);
    const topic = day.topics.find(t => t.id === topicId);
    const res = await fetch(`/api/topics/${topicId}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ done: !topic.done }) });
    if (res.status === 401) return handleUnauthorized();
    const updated = await res.json();
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, topics: d.topics.map(t => t.id === topicId ? updated : t) } : d));
  };

  const deleteTopic = async (dayId, topicId) => {
    const res = await fetch(`/api/topics/${topicId}`, { method: 'DELETE', headers: authHeaders() });
    if (res.status === 401) return handleUnauthorized();
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, topics: d.topics.filter(t => t.id !== topicId) } : d));
  };

  const editTopic = async (dayId, topicId, newText) => {
    const res = await fetch(`/api/topics/${topicId}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ text: newText }) });
    if (res.status === 401) return handleUnauthorized();
    const updated = await res.json();
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, topics: d.topics.map(t => t.id === topicId ? updated : t) } : d));
  };

  const updateTopicTag = async (dayId, topicId, tag) => {
    const res = await fetch(`/api/topics/${topicId}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ tag }) });
    if (res.status === 401) return handleUnauthorized();
    const updated = await res.json();
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, topics: d.topics.map(t => t.id === topicId ? updated : t) } : d));
  };

  const addNote = async (dayId, note) => {
    const res = await fetch(`/api/days/${dayId}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ note }) });
    if (res.status === 401) return handleUnauthorized();
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, note } : d));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-muted)] flex items-center justify-center font-mono text-sm">
        Loading...
      </main>
    );
  }

  const totalTopics    = days.reduce((a, d) => a + d.topics.length, 0);
  const doneTopics     = days.reduce((a, d) => a + d.topics.filter(t => t.done).length, 0);
  const dsaTopics      = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'dsa').length, 0);
  const daTopics       = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'da').length, 0);
  const genaiTopics    = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'genai').length, 0);
  const backendTopics  = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'backend').length, 0);
  const coreTopics     = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'core').length, 0);
  const aptitudeTopics = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'aptitude').length, 0);

  const today = new Date().toISOString().split('T')[0];
  const daysPassed = days.filter(d => d.date < today).length;

  const filteredDays = days.filter(d => {
    const matchSearch = search ? d.topics.some(t => t.text.toLowerCase().includes(search.toLowerCase())) : true;
    if (!matchSearch) return false;
    if (filter === 'pending') return d.topics.some(t => !t.done);
    if (filter === 'today')   return d.date === today;
    if (filter === 'done')    return d.topics.length > 0 && d.topics.every(t => t.done);
    return true;
  });

  const LEGEND = [
    { label: 'DSA', color: '#f78166' },
    { label: 'DA', color: '#d2a8ff' },
    { label: 'GenAI', color: '#79c0ff' },
    { label: 'Backend', color: '#56d364' },
    { label: 'Core', color: '#e3b341' },
    { label: 'Aptitude', color: '#ff7b72' },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-mono">
      <div className="border-b border-[var(--border-subtle)] px-4 py-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--accent-blue)]">Road to Offer</h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              14 Jun → 28 Jul 2026 &nbsp;·&nbsp; 45 days &nbsp;·&nbsp; Day {Math.min(daysPassed + 1, 45)} of 45
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {LEGEND.map(({ label, color }) => (
              <span key={label} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2 py-1 rounded text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                {label}
              </span>
            ))}
            {isAdmin ? (
              <button
                onClick={handleAdminLogout}
                className="bg-[var(--accent-green)]/10 border border-[var(--accent-green)] px-2 py-1 rounded text-xs text-[var(--accent-green-text)] hover:bg-[var(--accent-green)]/20 transition-colors"
                title="Click to log out of admin mode"
              >
                ● Admin
              </button>
            ) : (
              <button
                onClick={openLoginModal}
                className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)] transition-colors"
              >
                Admin Login
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)] transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀ Light' : '☾ Dark'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
        <StatsBar
          total={totalTopics} done={doneTopics} dsa={dsaTopics} da={daTopics}
          genai={genaiTopics} backend={backendTopics} core={coreTopics}
          aptitude={aptitudeTopics} daysPassed={daysPassed}
        />
        <div className="mt-5">
          <FilterBar filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} />
        </div>

        {!isAdmin && (
          <div className="mt-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-xs text-[var(--text-muted)]">
            👀 You're viewing in read-only mode. Only the admin can add or update tasks.
          </div>
        )}

        <div className="mt-5 space-y-2">
          {filteredDays.map(day => (
            <DayCard
              key={day.id} day={day} isToday={day.date === today}
              expanded={expandedDay === day.id} isAdmin={isAdmin}
              onToggleExpand={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
              onAddTopic={addTopic} onToggleTopic={toggleTopic} onDeleteTopic={deleteTopic}
              onEditTopic={editTopic} onUpdateTag={updateTopicTag} onAddNote={addNote}
            />
          ))}
        </div>
      </div>

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={() => setShowLoginModal(false)}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-sm font-bold text-[var(--text-primary)] mb-1">Admin Login</h2>
            <p className="text-xs text-[var(--text-muted)] mb-3">Enter the admin password to enable editing.</p>
            <input
              type="password" autoFocus value={loginInput}
              onChange={e => { setLoginInput(e.target.value); if (loginError) setLoginError(''); }}
              onKeyDown={e => e.key === 'Enter' && submitLogin()}
              placeholder="Password"
              className={`w-full bg-[var(--bg-base)] border rounded px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none mb-2 ${
                loginError ? 'border-[#f78166]' : 'border-[var(--border-default)] focus:border-[var(--accent-blue)]'
              }`}
            />
            {loginError && <p className="text-xs text-[#f78166] mb-3">⚠ {loginError}</p>}
            <div className={`flex justify-end gap-2 ${loginError ? '' : 'mt-3'}`}>
              <button onClick={() => setShowLoginModal(false)} className="text-xs px-3 py-1.5 rounded border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)] transition-colors">
                Cancel
              </button>
              <button onClick={submitLogin} disabled={loggingIn} className="text-xs px-3 py-1.5 rounded bg-[var(--accent-green)] hover:opacity-90 disabled:opacity-50 text-white transition-colors">
                {loggingIn ? 'Checking...' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Modal */}
      {popup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={() => setPopup(null)}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-sm font-bold text-[var(--text-primary)] mb-1">{popup.title}</h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">{popup.message}</p>
            <div className="flex justify-end">
              <button onClick={() => setPopup(null)} className="text-xs px-3 py-1.5 rounded bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] transition-colors">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}