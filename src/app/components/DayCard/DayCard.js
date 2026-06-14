'use client';

import { useState } from 'react';

export const TAG_CONFIG = {
  dsa:     { label: 'DSA',     color: 'bg-[#f781661a] text-[#f78166] border-[#f7816633]' },
  da:      { label: 'Data Analyst',      color: 'bg-[#d2a8ff1a] text-[#d2a8ff] border-[#d2a8ff33]' },
  ml:      { label: 'ML',      color: 'bg-[#79c0ff1a] text-[#79c0ff] border-[#79c0ff33]' },
  backend: { label: 'Backend Web', color: 'bg-[#56d3641a] text-[#56d364] border-[#56d36433]' },
  core:    { label: 'Core',    color: 'bg-[#e3b3411a] text-[#e3b341] border-[#e3b34133]' },
};

const TAG_ORDER = ['dsa', 'da', 'ml', 'backend', 'core'];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const TAG_DOT_COLORS = {
  dsa:     'bg-[#f78166]',
  da:      'bg-[#d2a8ff]',
  ml:      'bg-[#79c0ff]',
  backend: 'bg-[#56d364]',
  core:    'bg-[#e3b341]',
};

export default function DayCard({
  day,
  isToday,
  expanded,
  onToggleExpand,
  onAddTopic,
  onToggleTopic,
  onDeleteTopic,
  onUpdateTag,
  onAddNote,
}) {
  const [newTopic, setNewTopic] = useState('');
  const [newTag, setNewTag] = useState('dsa');
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(day.note || '');

  const totalTopics = day.topics.length;
  const doneTopics = day.topics.filter(t => t.done).length;
  const allDone = totalTopics > 0 && doneTopics === totalTopics;

  const handleAdd = () => {
    const trimmed = newTopic.trim();
    if (!trimmed) return;
    onAddTopic(day.id, trimmed, newTag);
    setNewTopic('');
  };

  const handleNoteBlur = () => {
    onAddNote(day.id, noteText);
    setEditingNote(false);
  };

  const cycleTag = (currentTag) => {
    const idx = TAG_ORDER.indexOf(currentTag);
    return TAG_ORDER[(idx + 1) % TAG_ORDER.length];
  };

  const isPast = new Date(day.date + 'T00:00:00') < new Date(new Date().toDateString());

  // Unique tags present in this day's topics
  const presentTags = TAG_ORDER.filter(tag => day.topics.some(t => t.tag === tag));

  return (
    <div
      className={`border rounded-lg transition-colors ${
        isToday
          ? 'border-[#58a6ff] bg-[#161b22]'
          : allDone
          ? 'border-[#238636] bg-[#0d1117]'
          : 'border-[#21262d] bg-[#0d1117] hover:border-[#30363d]'
      }`}
    >
      {/* Header row */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {/* Day number */}
        <span
          className={`text-xs font-bold w-8 h-8 flex items-center justify-center rounded border shrink-0 ${
            isToday
              ? 'border-[#58a6ff] text-[#58a6ff]'
              : allDone
              ? 'border-[#238636] text-[#3fb950]'
              : isPast && totalTopics === 0
              ? 'border-[#21262d] text-[#484f58]'
              : 'border-[#21262d] text-[#8b949e]'
          }`}
        >
          {day.id}
        </span>

        {/* Date */}
        <span className={`text-sm flex-1 ${isToday ? 'text-[#58a6ff] font-semibold' : 'text-[#8b949e]'}`}>
          {formatDate(day.date)}
          {isToday && <span className="ml-2 text-[10px] uppercase tracking-widest text-[#58a6ff]">today</span>}
        </span>

        {/* Done count */}
        {totalTopics > 0 && (
          <span className="text-xs text-[#8b949e] hidden sm:inline">
            {doneTopics}/{totalTopics}
          </span>
        )}

        {/* Tag dots — one per unique tag present */}
        <div className="flex gap-1">
          {presentTags.map(tag => (
            <span key={tag} className={`w-1.5 h-1.5 rounded-full ${TAG_DOT_COLORS[tag]}`} />
          ))}
        </div>

        {/* Progress mini bar */}
        {totalTopics > 0 && (
          <div className="w-16 h-1 bg-[#21262d] rounded-full overflow-hidden shrink-0">
            <div
              className={`h-full rounded-full transition-all ${allDone ? 'bg-[#238636]' : 'bg-[#58a6ff]'}`}
              style={{ width: `${(doneTopics / totalTopics) * 100}%` }}
            />
          </div>
        )}

        {/* Chevron */}
        <span className={`text-[#484f58] text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#21262d] pt-3">
          {/* Topics list */}
          <div className="space-y-1.5">
            {day.topics.length === 0 && (
              <p className="text-xs text-[#484f58] italic">No topics yet. Add one below.</p>
            )}
            {day.topics.map(topic => (
              <div
                key={topic.id}
                className={`flex items-center gap-2 group rounded px-2 py-1.5 transition-colors ${
                  topic.done ? 'bg-[#0d1117]' : 'bg-[#161b22]'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => onToggleTopic(day.id, topic.id)}
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    topic.done
                      ? 'bg-[#238636] border-[#238636]'
                      : 'border-[#30363d] hover:border-[#58a6ff]'
                  }`}
                >
                  {topic.done && <span className="text-white text-[10px]">✓</span>}
                </button>

                {/* Text */}
                <span
                  className={`flex-1 text-sm transition-colors ${
                    topic.done ? 'line-through text-[#484f58]' : 'text-[#e6edf3]'
                  }`}
                >
                  {topic.text}
                </span>

                {/* Tag cycler */}
                <button
                  onClick={() => onUpdateTag(day.id, topic.id, cycleTag(topic.tag))}
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${TAG_CONFIG[topic.tag].color}`}
                  title="Click to cycle tag"
                >
                  {TAG_CONFIG[topic.tag].label}
                </button>

                {/* Delete */}
                <button
                  onClick={() => onDeleteTopic(day.id, topic.id)}
                  className="text-[#484f58] hover:text-[#f78166] text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Add topic */}
          <div className="flex gap-2">
            <select
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              className="bg-[#161b22] border border-[#21262d] rounded px-2 text-xs text-[#8b949e] focus:outline-none focus:border-[#58a6ff] shrink-0"
            >
              {TAG_ORDER.map(tag => (
                <option key={tag} value={tag}>{TAG_CONFIG[tag].label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Add topic..."
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="flex-1 bg-[#161b22] border border-[#21262d] rounded px-3 py-1.5 text-xs text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] transition-colors"
            />
            <button
              onClick={handleAdd}
              className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded px-3 py-1.5 text-xs text-[#e6edf3] transition-colors shrink-0"
            >
              + Add
            </button>
          </div>

          {/* Note */}
          <div>
            {editingNote ? (
              <textarea
                autoFocus
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onBlur={handleNoteBlur}
                placeholder="Day notes, links, or reflections..."
                rows={2}
                className="w-full bg-[#161b22] border border-[#21262d] rounded px-3 py-2 text-xs text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] transition-colors resize-none"
              />
            ) : (
              <button
                onClick={() => setEditingNote(true)}
                className="text-xs text-[#484f58] hover:text-[#8b949e] transition-colors text-left w-full"
              >
                {day.note ? (
                  <span className="text-[#8b949e]">{day.note}</span>
                ) : (
                  '+ Add note'
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}