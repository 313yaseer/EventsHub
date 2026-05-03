function getBarColor(percent) {
  if (percent > 90) return 'bg-red-500'
  if (percent >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
}

export default function UsageBar({ label, used = 0, limit = 0, unit = '' }) {
  const isUnlimited = limit === -1
  const percent = isUnlimited || limit <= 0 ? 0 : Math.min(100, Math.round((used / limit) * 100))
  const unitLabel = unit ? ` ${unit}` : ''

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        {label ? <span className="font-medium text-slate-300">{label}</span> : <span />}
        <span className="text-slate-400">
          {isUnlimited ? 'Unlimited' : `${used} / ${limit}${unitLabel} used`}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className={['h-full rounded-full transition-all', getBarColor(percent)].join(' ')}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
