'use client';

const FILTERS = [
  { id: 'all',     label: 'All Days' },
  { id: 'pending', label: 'Pending' },
  { id: 'today',   label: 'Today' },
  { id: 'done',    label: 'Done' },
];

export default function FilterBar({ filter, setFilter, search, setSearch }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex gap-1 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-xs px-3 py-1.5 rounded border transition-colors ${
              filter === f.id
                ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white'
                : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}