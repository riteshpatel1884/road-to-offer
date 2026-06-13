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
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current || days.length === 0) return;
    hasFetched.current = true;

    const today = new Date().toISOString().split('T')[0];
    const todayDay = days.find(d => d.date === today);
    const todayTopics = todayDay ? todayDay.topics : [];
    const todayDone = todayTopics.filter(t => t.done).length;

    const daysRemaining = TOTAL_DAYS - daysPassed;
    const pendingTopics = totalTopics - doneTopics;
    const completionRate = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;

    const missedDays = days.filter(d => {
      const isPast = new Date(d.date + 'T00:00:00') < new Date(new Date().toDateString());
      return isPast && d.topics.length === 0;
    }).length;

    // Determine most neglected tag
    const tagCounts = { dsa: dsaTopics, da: daTopics, ml: mlTopics, backend: backendTopics, core: coreTopics };
    const mostNeglected = Object.entries(tagCounts).sort((a, b) => a[1] - b[1])[0][0].toUpperCase();

    const prompt = `You are an AI coach for a 45-day placement prep tracker. Analyze this data and give a focused, honest review.

DATA:
- Days elapsed: ${daysPassed} / 45 | Days remaining: ${daysRemaining}
- Topics: ${totalTopics} logged, ${doneTopics} done (${completionRate}%), ${pendingTopics} pending
- Today: ${todayDone}/${todayTopics.length} done
- Missed past days (no topics): ${missedDays}
- Tag counts — DSA: ${dsaTopics}, DA: ${daTopics}, ML: ${mlTopics}, Backend: ${backendTopics}, Core: ${coreTopics}
- Most neglected tag: ${mostNeglected}

Respond ONLY with raw JSON (no markdown, no preamble):
{
  "status_emoji": "one emoji that captures their overall status (e.g. 🔥 if doing well, ⚠️ if behind, 🚀 if great)",
  "headline": "Short punchy 1-line status (max 8 words)",
  "progress": "Current progress in 1-2 sentences. Use specific numbers. Is the completion rate on track given days elapsed?",
  "on_track": "Are they ahead, on track, or falling behind their plan? Be blunt. What needs to happen to stay on schedule? 1-2 sentences.",
  "weak_spot": "Which area/tag is being ignored and what's the risk? 1 sentence.",
  "action": "The ONE most important thing to do today. Specific and direct."
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
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 400,
            temperature: 0.7,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData?.error?.message || `Groq API error ${res.status}`);
        }

        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || '';
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
      <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] uppercase tracking-widest text-[#58a6ff] font-bold">AI Coach</span>
          <span className="text-[10px] text-[#484f58]">· analyzing...</span>
        </div>
        <div className="h-3 bg-[#21262d] rounded w-1/2 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-2 bg-[#21262d] rounded w-1/3" />
              <div className="h-2 bg-[#21262d] rounded w-full" />
              <div className="h-2 bg-[#21262d] rounded w-4/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-[#161b22] border border-[#f7816633] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-widest text-[#f78166] font-bold">AI Coach</span>
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

  // ── Insight card — always fully visible ──────────────────────────────────
  return (
    <div className="bg-[#161b22] border border-[#58a6ff33] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#21262d]">
        <span className="text-[10px] uppercase tracking-widest text-[#58a6ff] font-bold">Summary by AI</span>
        <span className="text-base leading-none">{insight.status_emoji}</span>
        <span className="text-xs font-semibold text-[#e6edf3] ml-1">{insight.headline}</span>
      </div>

      {/* 4 insight blocks — always shown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#21262d]">
        <InsightBlock
          icon="📊"
          label="Progress"
          text={insight.progress}
          accent="text-[#8b949e]"
        />
        <InsightBlock
          icon="📈"
          label="On Track?"
          text={insight.on_track}
          accent="text-[#8b949e]"
        />
        <InsightBlock
          icon="⚠️"
          label="Weak Spot"
          text={insight.weak_spot}
          accent="text-[#e3b341]"
        />
        <InsightBlock
          icon="✅"
          label="Do This Now"
          text={insight.action}
          accent="text-[#3fb950]"
        />
      </div>
    </div>
  );
}

function InsightBlock({ icon, label, text, accent }) {
  return (
    <div className="bg-[#161b22] px-4 py-3 space-y-1">
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

        {/* AI Coach Panel */}
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