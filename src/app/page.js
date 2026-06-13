'use client';

import { useState, useEffect, useRef } from 'react';
import DayCard from './components/DayCard/DayCard';
import StatsBar from './components/StatsBar/StatsBar';
import FilterBar from './components/FilterBar/FilterBar';

const START_DATE = new Date('2026-06-14');
const TOTAL_DAYS = 45;
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;

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

// ─── AI Insight Panel ────────────────────────────────────────────────────────

function AIInsightPanel({ days, totalTopics, doneTopics, dsaTopics, daTopics, mlTopics, backendTopics, coreTopics, daysPassed }) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Only fire once, and only when days data is loaded
    if (hasFetched.current || days.length === 0) return;
    hasFetched.current = true;

    const today = new Date().toISOString().split('T')[0];
    const todayDay = days.find(d => d.date === today);
    const todayTopics = todayDay ? todayDay.topics : [];
    const todayDone = todayTopics.filter(t => t.done).length;

    // Build a compact summary for the prompt
    const activeDays = days.filter(d => d.topics.length > 0);
    const missedDays = days.filter(d => {
      const isPast = new Date(d.date + 'T00:00:00') < new Date(new Date().toDateString());
      return isPast && d.topics.length === 0;
    });
    const daysRemaining = TOTAL_DAYS - daysPassed;
    const pendingTopics = totalTopics - doneTopics;
    const completionRate = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;

    // Topics per tag breakdown
    const tagBreakdown = `DSA: ${dsaTopics}, Data Analyst: ${daTopics}, ML: ${mlTopics}, Backend: ${backendTopics}, Core Subjects: ${coreTopics}`;

    // Recent activity (last 5 days with topics)
    const recentActivity = days
      .filter(d => d.topics.length > 0)
      .slice(-5)
      .map(d => {
        const done = d.topics.filter(t => t.done).length;
        return `Day ${d.id} (${d.date}): ${done}/${d.topics.length} done`;
      })
      .join(', ');

    const prompt = `You are an AI coach for a 45-day placement preparation tracker. Here is the student's current progress data:

OVERVIEW:
- Total days in plan: 45 (14 Jun → 28 Jul 2026)
- Days elapsed: ${daysPassed}
- Days remaining: ${daysRemaining}
- Today's date: ${today}

TOPICS PROGRESS:
- Total topics logged: ${totalTopics}
- Completed: ${doneTopics} (${completionRate}%)
- Pending: ${pendingTopics}
- Topic breakdown by role: ${tagBreakdown}

ACTIVITY:
- Active days (with topics): ${activeDays.length}
- Missed/empty past days: ${missedDays.length}
- Today's progress: ${todayDone}/${todayTopics.length} topics done
- Recent activity: ${recentActivity || 'No topics added yet'}

Please provide a concise, motivating AI insight in exactly this JSON structure (respond with raw JSON only, no markdown):
{
  "headline": "A short punchy 1-line status (e.g. 'Strong start — keep the streak alive')",
  "summary": "2-3 sentence overall progress summary. Be specific with numbers. Honest but encouraging.",
  "streak_analysis": "1-2 sentences about consistency — are they studying daily? any gaps?",
  "missed_day_prediction": "If they skip tomorrow, what specifically falls behind? Be concrete about which tags/topics would lag. 1-2 sentences.",
  "pace_analysis": "Are they on track to finish all topics before Day 45? At current pace, what happens? 1-2 sentences.",
  "tag_imbalance": "Which tag/role is being neglected vs overdone? Specific advice. 1-2 sentences.",
  "action_for_today": "One specific, actionable thing they should do TODAY based on the data. Be direct.",
  "motivational_close": "One final punchy motivational line tailored to their situation"
}`;

    async function fetchInsight() {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 600,
            temperature: 0.7,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData?.error?.message || `Groq API error ${res.status}`);
        }

        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || '';

        // Strip any accidental markdown fences
        const clean = raw.replace(/```json|```/gi, '').trim();
        const parsed = JSON.parse(clean);
        setInsight(parsed);
      } catch (err) {
        setError(err.message || 'Failed to load AI insights.');
      } finally {
        setLoading(false);
      }
    }

    fetchInsight();
  }, [days]);

  // ── Skeleton loader ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-4 space-y-3 animate-pulse">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-[#58a6ff]">AI Coach</span>
          <span className="text-[10px] text-[#484f58]">· analyzing your progress...</span>
        </div>
        <div className="h-3 bg-[#21262d] rounded w-2/3" />
        <div className="h-2 bg-[#21262d] rounded w-full" />
        <div className="h-2 bg-[#21262d] rounded w-5/6" />
        <div className="h-2 bg-[#21262d] rounded w-4/6" />
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-[#161b22] border border-[#f7816633] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-widest text-[#f78166]">AI Coach</span>
        </div>
        <p className="text-xs text-[#8b949e]">
          Could not load insights: <span className="text-[#f78166]">{error}</span>
        </p>
        <p className="text-[10px] text-[#484f58] mt-1">
          Make sure <code className="text-[#e3b341]">NEXT_PUBLIC_GROQ_API_KEY</code> is set in your <code>.env.local</code>.
        </p>
      </div>
    );
  }

  if (!insight) return null;

  // ── Insight card ─────────────────────────────────────────────────────────
  return (
    <div className="bg-[#161b22] border border-[#58a6ff33] rounded-lg overflow-hidden">
      {/* Top bar */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#1c2128] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest text-[#58a6ff] font-bold">AI Coach</span>
          <span className="text-[10px] text-[#484f58]">· powered by Groq</span>
          <span className="text-xs text-[#e6edf3] hidden sm:inline font-semibold">
            {insight.headline}
          </span>
        </div>
        <span className={`text-[#484f58] text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Headline visible on mobile even collapsed */}
      <div className="px-4 pb-2 sm:hidden">
        <p className="text-xs text-[#e6edf3] font-semibold">{insight.headline}</p>
      </div>

      {/* Expanded sections */}
      {expanded && (
        <div className="border-t border-[#21262d] px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InsightBlock icon="📊" label="Progress Summary" text={insight.summary} />
          <InsightBlock icon="🔥" label="Consistency" text={insight.streak_analysis} />
          <InsightBlock icon="⚠️" label="If You Skip Tomorrow" text={insight.missed_day_prediction} accent="text-[#e3b341]" />
          <InsightBlock icon="📈" label="Pace Analysis" text={insight.pace_analysis} />
          <InsightBlock icon="⚖️" label="Tag Balance" text={insight.tag_imbalance} />
          <InsightBlock icon="✅" label="Today's Action" text={insight.action_for_today} accent="text-[#3fb950]" />
          {/* Motivational close — full width */}
          <div className="sm:col-span-2 border-t border-[#21262d] pt-3 mt-1">
            <p className="text-xs text-[#58a6ff] italic text-center">"{insight.motivational_close}"</p>
          </div>
        </div>
      )}
    </div>
  );
}

function InsightBlock({ icon, label, text, accent = 'text-[#8b949e]' }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] uppercase tracking-widest text-[#484f58] flex items-center gap-1.5">
        <span>{icon}</span>{label}
      </span>
      <p className={`text-xs leading-relaxed ${accent}`}>{text}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [days, setDays] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('placement-tracker-v1');
    if (saved) {
      setDays(JSON.parse(saved));
    } else {
      setDays(generateDays());
    }

    // Auto-expand today
    const today = new Date().toISOString().split('T')[0];
    const todayIdx = generateDays().findIndex(d => d.date === today);
    if (todayIdx !== -1) setExpandedDay(todayIdx + 1);
  }, []);

  useEffect(() => {
    if (days.length > 0) {
      localStorage.setItem('placement-tracker-v1', JSON.stringify(days));
    }
  }, [days]);

  const addTopic = (dayId, topic, tag) => {
    setDays(prev =>
      prev.map(d =>
        d.id === dayId
          ? { ...d, topics: [...d.topics, { id: Date.now(), text: topic, done: false, tag: tag || 'dsa' }] }
          : d
      )
    );
  };

  const toggleTopic = (dayId, topicId) => {
    setDays(prev =>
      prev.map(d =>
        d.id === dayId
          ? { ...d, topics: d.topics.map(t => t.id === topicId ? { ...t, done: !t.done } : t) }
          : d
      )
    );
  };

  const deleteTopic = (dayId, topicId) => {
    setDays(prev =>
      prev.map(d =>
        d.id === dayId
          ? { ...d, topics: d.topics.filter(t => t.id !== topicId) }
          : d
      )
    );
  };

  const updateTopicTag = (dayId, topicId, tag) => {
    setDays(prev =>
      prev.map(d =>
        d.id === dayId
          ? { ...d, topics: d.topics.map(t => t.id === topicId ? { ...t, tag } : t) }
          : d
      )
    );
  };

  const addNote = (dayId, note) => {
    setDays(prev =>
      prev.map(d => d.id === dayId ? { ...d, note } : d)
    );
  };

  // Stats
  const totalTopics   = days.reduce((a, d) => a + d.topics.length, 0);
  const doneTopics    = days.reduce((a, d) => a + d.topics.filter(t => t.done).length, 0);
  const dsaTopics     = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'dsa').length, 0);
  const daTopics      = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'da').length, 0);
  const mlTopics      = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'ml').length, 0);
  const backendTopics = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'backend').length, 0);
  const coreTopics    = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'core').length, 0);

  const today = new Date().toISOString().split('T')[0];
  const daysPassed = days.filter(d => d.date < today).length;

  const filteredDays = days.filter(d => {
    const matchSearch = search
      ? d.topics.some(t => t.text.toLowerCase().includes(search.toLowerCase()))
      : true;

    if (!matchSearch) return false;

    if (filter === 'dsa')     return d.topics.some(t => t.tag === 'dsa');
    if (filter === 'da')      return d.topics.some(t => t.tag === 'da');
    if (filter === 'ml')      return d.topics.some(t => t.tag === 'ml');
    if (filter === 'backend') return d.topics.some(t => t.tag === 'backend');
    if (filter === 'core')    return d.topics.some(t => t.tag === 'core');
    if (filter === 'pending') return d.topics.some(t => !t.done);
    if (filter === 'done')    return d.topics.length > 0 && d.topics.every(t => t.done);
    return true;
  });

  const LEGEND = [
    { label: 'DSA',     color: '#f78166' },
    { label: 'DA',      color: '#d2a8ff' },
    { label: 'ML',      color: '#79c0ff' },
    { label: 'Backend', color: '#56d364' },
    { label: 'Core',    color: '#e3b341' },
  ];

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#e6edf3] font-mono">
      {/* Header */}
      <div className="border-b border-[#21262d] px-4 py-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#58a6ff]">
              placement.prep
            </h1>
            <p className="text-xs text-[#8b949e] mt-0.5">
              14 Jun → 28 Jul 2026 &nbsp;·&nbsp; 45 days &nbsp;·&nbsp; Day {Math.min(daysPassed + 1, 45)} of 45
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {LEGEND.map(({ label, color }) => (
              <span
                key={label}
                className="bg-[#161b22] border border-[#21262d] px-2 py-1 rounded text-xs text-[#8b949e] flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-5">
        <StatsBar
          total={totalTopics}
          done={doneTopics}
          dsa={dsaTopics}
          da={daTopics}
          ml={mlTopics}
          backend={backendTopics}
          core={coreTopics}
          daysPassed={daysPassed}
        />

        {/* AI Coach Panel — auto-triggers on mount once days load */}
        <AIInsightPanel
          days={days}
          totalTopics={totalTopics}
          doneTopics={doneTopics}
          dsaTopics={dsaTopics}
          daTopics={daTopics}
          mlTopics={mlTopics}
          backendTopics={backendTopics}
          coreTopics={coreTopics}
          daysPassed={daysPassed}
        />

        <FilterBar
          filter={filter}
          setFilter={setFilter}
          search={search}
          setSearch={setSearch}
        />

        <div className="space-y-2">
          {filteredDays.map(day => (
            <DayCard
              key={day.id}
              day={day}
              isToday={day.date === today}
              expanded={expandedDay === day.id}
              onToggleExpand={() =>
                setExpandedDay(expandedDay === day.id ? null : day.id)
              }
              onAddTopic={addTopic}
              onToggleTopic={toggleTopic}
              onDeleteTopic={deleteTopic}
              onUpdateTag={updateTopicTag}
              onAddNote={addNote}
            />
          ))}
        </div>
      </div>
    </main>
  );
}