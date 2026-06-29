'use client';

import { useState } from 'react';

export const TAG_CONFIG = {
  dsa:      { label: 'DSA',          color: 'bg-[#f781661a] text-[#f78166] border-[#f7816633]' },
  da:       { label: 'Data Analyst', color: 'bg-[#d2a8ff1a] text-[#d2a8ff] border-[#d2a8ff33]' },
  genai:    { label: 'Gen AI',       color: 'bg-[#79c0ff1a] text-[#79c0ff] border-[#79c0ff33]' },
  backend:  { label: 'Backend Web',  color: 'bg-[#56d3641a] text-[#56d364] border-[#56d36433]' },
  core:     { label: 'Core',         color: 'bg-[#e3b3411a] text-[#e3b341] border-[#e3b34133]' },
  aptitude: { label: 'Aptitude',     color: 'bg-[#ff7b721a] text-[#ff7b72] border-[#ff7b7233]' },
};

const TAG_ORDER = ['dsa', 'da', 'genai', 'backend', 'core', 'aptitude'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const TAG_DOT_COLORS = {
  dsa:      'bg-[#f78166]',
  da:       'bg-[#d2a8ff]',
  genai:    'bg-[#79c0ff]',
  backend:  'bg-[#56d364]',
  core:     'bg-[#e3b341]',
  aptitude: 'bg-[#ff7b72]',
};

export default function DayCard({ day, isToday, expanded, isAdmin, onToggleExpand, onAddTopic, onToggleTopic, onDeleteTopic, onEditTopic, onUpdateTag, onAddNote }) {
  const [newTopic, setNewTopic] = useState('');
  const [newTag, setNewTag] = useState('dsa');
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(day.note || '');
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editTopicText, setEditTopicText] = useState('');

  const totalTopics = day.topics.length;
  const doneTopics = day.topics.filter(t => t.done).length;
  const allDone = totalTopics > 0 && doneTopics === totalTopics;

  const handleAdd = () => {
    const trimmed = newTopic.trim();
    if (!trimmed) return;
    onAddTopic(day.id, trimmed, newTag);
    setNewTopic('');
  };

  const handleNoteBlur = () => { onAddNote(day.id, noteText); setEditingNote(false); };
  const cycleTag = (currentTag) => TAG_ORDER[(TAG_ORDER.indexOf(currentTag) + 1) % TAG_ORDER.length];
  const startEditTopic = (topic) => { setEditingTopicId(topic.id); setEditTopicText(topic.text); };
  const saveEditTopic = (topicId) => { const t = editTopicText.trim(); if (t) onEditTopic(day.id, topicId, t); setEditingTopicId(null); setEditTopicText(''); };
  const cancelEditTopic = () => { setEditingTopicId(null); setEditTopicText(''); };

  const isPast = new Date(day.date + 'T00:00:00') < new Date(new Date().toDateString());
  const presentTags = TAG_ORDER.filter(tag => day.topics.some(t => t.tag === tag));

  return (
    <div className={`border rounded-lg transition-colors ${
      isToday  ? 'border-[var(--accent-blue)] bg-[var(--bg-surface)]'
      : allDone ? 'border-[var(--accent-green)] bg-[var(--bg-base)]'
      : 'border-[var(--border-subtle)] bg-[var(--bg-base)] hover:border-[var(--border-default)]'
    }`}>
      {/* Header */}
      <button onClick={onToggleExpand} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        <span className={`text-xs font-bold w-8 h-8 flex items-center justify-center rounded border shrink-0 ${
          isToday  ? 'border-[var(--accent-blue)] text-[var(--accent-blue)]'
          : allDone ? 'border-[var(--accent-green)] text-[var(--accent-green-text)]'
          : isPast && totalTopics === 0 ? 'border-[var(--border-subtle)] text-[var(--text-faint)]'
          : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
        }`}>
          {day.id}
        </span>

        <span className={`text-sm flex-1 ${isToday ? 'text-[var(--accent-blue)] font-semibold' : 'text-[var(--text-muted)]'}`}>
          {formatDate(day.date)}
          {isToday && <span className="ml-2 text-[10px] uppercase tracking-widest text-[var(--accent-blue)]">today</span>}
        </span>

        {totalTopics > 0 && (
          <span className="text-xs text-[var(--text-muted)] hidden sm:inline">{doneTopics}/{totalTopics}</span>
        )}

        <div className="flex gap-1">
          {presentTags.map(tag => <span key={tag} className={`w-1.5 h-1.5 rounded-full ${TAG_DOT_COLORS[tag]}`} />)}
        </div>

        {totalTopics > 0 && (
          <div className="w-16 h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden shrink-0">
            <div
              className={`h-full rounded-full transition-all ${allDone ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-blue)]'}`}
              style={{ width: `${(doneTopics / totalTopics) * 100}%` }}
            />
          </div>
        )}

        <span className={`text-[var(--text-faint)] text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--border-subtle)] pt-3">
          <div className="space-y-1.5">
            {day.topics.length === 0 && <p className="text-xs text-[var(--text-faint)] italic">No topics yet.</p>}
            {day.topics.map(topic => (
              <div key={topic.id} className={`flex items-center gap-2 group rounded px-2 py-1.5 transition-colors ${
                topic.done ? 'bg-[var(--bg-base)]' : 'bg-[var(--bg-surface)]'
              }`}>
                <button
                  onClick={() => isAdmin && onToggleTopic(day.id, topic.id)}
                  disabled={!isAdmin}
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    topic.done ? 'bg-[var(--accent-green)] border-[var(--accent-green)]' : 'border-[var(--border-default)]'
                  } ${isAdmin ? 'hover:border-[var(--accent-blue)] cursor-pointer' : 'cursor-default opacity-80'}`}
                >
                  {topic.done && <span className="text-white text-[10px]">✓</span>}
                </button>

                {isAdmin && editingTopicId === topic.id ? (
                  <input
                    type="text" autoFocus value={editTopicText}
                    onChange={e => setEditTopicText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEditTopic(topic.id); if (e.key === 'Escape') cancelEditTopic(); }}
                    onBlur={() => saveEditTopic(topic.id)}
                    className="flex-1 bg-[var(--bg-base)] border border-[var(--accent-blue)] rounded px-2 py-0.5 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                ) : (
                  <span
                    onDoubleClick={() => isAdmin && startEditTopic(topic)}
                    className={`flex-1 text-sm transition-colors ${isAdmin ? 'cursor-text' : ''} ${
                      topic.done ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {topic.text}
                  </span>
                )}

                {isAdmin && editingTopicId !== topic.id && (
                  <button onClick={() => startEditTopic(topic)} className="text-[var(--text-faint)] hover:text-[var(--accent-blue)] text-xs opacity-0 group-hover:opacity-100 transition-opacity" title="Edit topic">
                    ✎
                  </button>
                )}

                {isAdmin ? (
                  <button onClick={() => onUpdateTag(day.id, topic.id, cycleTag(topic.tag))} className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${TAG_CONFIG[topic.tag].color}`} title="Click to cycle tag">
                    {TAG_CONFIG[topic.tag].label}
                  </button>
                ) : (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${TAG_CONFIG[topic.tag].color}`}>
                    {TAG_CONFIG[topic.tag].label}
                  </span>
                )}

                {isAdmin && (
                  <button onClick={() => onDeleteTopic(day.id, topic.id)} className="text-[var(--text-faint)] hover:text-[#f78166] text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {isAdmin && (
            <div className="flex gap-2">
              <select
                value={newTag} onChange={e => setNewTag(e.target.value)}
                className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-2 text-xs text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] shrink-0"
              >
                {TAG_ORDER.map(tag => <option key={tag} value={tag}>{TAG_CONFIG[tag].label}</option>)}
              </select>
              <input
                type="text" placeholder="Add topic..." value={newTopic}
                onChange={e => setNewTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
              />
              <button onClick={handleAdd} className="bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] border border-[var(--border-default)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] transition-colors shrink-0">
                + Add
              </button>
            </div>
          )}

          <div>
            {isAdmin ? (
              editingNote ? (
                <textarea
                  autoFocus value={noteText} onChange={e => setNoteText(e.target.value)} onBlur={handleNoteBlur}
                  placeholder="Day notes, links, or reflections..." rows={2}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors resize-none"
                />
              ) : (
                <button onClick={() => setEditingNote(true)} className="text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors text-left w-full">
                  {day.note ? <span className="text-[var(--text-muted)]">{day.note}</span> : '+ Add note'}
                </button>
              )
            ) : (
              day.note && <p className="text-xs text-[var(--text-muted)]">{day.note}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}