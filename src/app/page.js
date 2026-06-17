'use client';

import { useState, useEffect } from 'react';
import DayCard from './components/DayCard/DayCard';
import StatsBar from './components/StatsBar/StatsBar';
import FilterBar from './components/FilterBar/FilterBar';

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

  const editTopic = (dayId, topicId, newText) => {
    setDays(prev =>
      prev.map(d =>
        d.id === dayId
          ? { ...d, topics: d.topics.map(t => t.id === topicId ? { ...t, text: newText } : t) }
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
  const totalTopics    = days.reduce((a, d) => a + d.topics.length, 0);
  const doneTopics     = days.reduce((a, d) => a + d.topics.filter(t => t.done).length, 0);
  const dsaTopics      = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'dsa').length, 0);
  const daTopics       = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'da').length, 0);
  const mlTopics       = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'ml').length, 0);
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
    if (filter === 'ml')       return d.topics.some(t => t.tag === 'ml');
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
    { label: 'ML',       color: '#79c0ff' },
    { label: 'Backend',  color: '#56d364' },
    { label: 'Core',     color: '#e3b341' },
    { label: 'Aptitude', color: '#ff7b72' },
  ];

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

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
        {/* Stats bar — full width on top */}
        <StatsBar
          total={totalTopics}
          done={doneTopics}
          dsa={dsaTopics}
          da={daTopics}
          ml={mlTopics}
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