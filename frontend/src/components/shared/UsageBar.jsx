export default function UsageBar({ value = 0 }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-200">
      <div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: `${value}%` }} />
    </div>
  )
}
