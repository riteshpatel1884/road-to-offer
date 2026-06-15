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
                ? 'bg-[#58a6ff] border-[#58a6ff] text-[#0d1117]'
                : 'bg-[#161b22] border-[#21262d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#30363d]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}