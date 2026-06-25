'use client';

export default function StatsBar({ total, done, dsa, da, genai, backend, core, aptitude, daysPassed }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const dayPct = Math.round((Math.min(daysPassed, 45) / 45) * 100);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {/* Overall Progress — full width */}
      <div className="col-span-2 sm:col-span-5 bg-[#161b22] border border-[#21262d] rounded-lg p-4">
        <div className="flex justify-between text-xs text-[#8b949e] mb-2">
          <span>Overall completion</span>
          <span className="text-[#e6edf3]">{done}/{total} topics &nbsp;·&nbsp; {pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-[#21262d] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#238636] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[#8b949e] mt-2">
          <span>Time elapsed</span>
          <span className="text-[#e6edf3]">{Math.min(daysPassed, 45)}/45 days &nbsp;·&nbsp; {dayPct}%</span>
        </div>
        <div className="w-full h-1.5 bg-[#21262d] rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-[#58a6ff] rounded-full transition-all duration-500"
            style={{ width: `${dayPct}%` }}
          />
        </div>
      </div>

      <StatCard label="DSA"          value={dsa}        color="text-[#f78166]" />
      <StatCard label="Data Analyst"        value={da}         color="text-[#d2a8ff]" />
      <StatCard label="Gen AI"           value={genai}         color="text-[#79c0ff]" />
      <StatCard label="Backend"      value={backend}    color="text-[#56d364]" />
      <StatCard label="Core"         value={core}       color="text-[#e3b341]" />
      <StatCard label="Aptitude"     value={aptitude}   color="text-[#ff7b72]" />

      <StatCard label="Completed"  value={done}       color="text-[#3fb950]" />
      <StatCard label="Remaining"  value={total-done} color="text-[#e3b341]" />
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-3 flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-[#8b949e]">{label}</span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
  );
}
