'use client';

import { useState, useEffect } from 'react';
import DayCard from '../components/DayCard';
import StatsBar from '../components/StatsBar';
import FilterBar from '../components/FilterBar';

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

export default function Home() {
  const [days, setDays] = useState([]);
  const [filter, setFilter] = useState('all'); // all | dsa | da | pending | done
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

  const addTopic = (dayId, topic) => {
    setDays(prev =>
      prev.map(d =>
        d.id === dayId
          ? { ...d, topics: [...d.topics, { id: Date.now(), text: topic, done: false, tag: 'dsa' }] }
          : d
      )
    );
  };

  const toggleTopic = (dayId, topicId) => {
    setDays(prev =>
      prev.map(d =>
        d.id === dayId
          ? {
              ...d,
              topics: d.topics.map(t =>
                t.id === topicId ? { ...t, done: !t.done } : t
              ),
            }
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
          ? {
              ...d,
              topics: d.topics.map(t =>
                t.id === topicId ? { ...t, tag } : t
              ),
            }
          : d
      )
    );
  };

  const addNote = (dayId, note) => {
    setDays(prev =>
      prev.map(d =>
        d.id === dayId ? { ...d, note } : d
      )
    );
  };

  const totalTopics = days.reduce((a, d) => a + d.topics.length, 0);
  const doneTopics = days.reduce((a, d) => a + d.topics.filter(t => t.done).length, 0);
  const dsaTopics = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'dsa').length, 0);
  const daTopics = days.reduce((a, d) => a + d.topics.filter(t => t.tag === 'da').length, 0);

  const today = new Date().toISOString().split('T')[0];
  const daysPassed = days.filter(d => d.date < today).length;

  const filteredDays = days.filter(d => {
    const matchSearch = search
      ? d.topics.some(t => t.text.toLowerCase().includes(search.toLowerCase()))
      : true;

    if (!matchSearch) return false;

    if (filter === 'dsa') return d.topics.some(t => t.tag === 'dsa');
    if (filter === 'da') return d.topics.some(t => t.tag === 'da');
    if (filter === 'pending') return d.topics.some(t => !t.done);
    if (filter === 'done') return d.topics.length > 0 && d.topics.every(t => t.done);
    return true;
  });

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
          <div className="flex gap-3 text-xs text-[#8b949e]">
            <span className="bg-[#161b22] border border-[#21262d] px-2 py-1 rounded">
              DSA
            </span>
            <span className="bg-[#161b22] border border-[#21262d] px-2 py-1 rounded">
              Data Analyst
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-5">
        <StatsBar
          total={totalTopics}
          done={doneTopics}
          dsa={dsaTopics}
          da={daTopics}
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