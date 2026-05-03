export default function Toggle({ enabled = false }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
      {enabled ? 'On' : 'Off'}
    </span>
  )
}
