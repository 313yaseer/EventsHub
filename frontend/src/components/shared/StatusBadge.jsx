export default function StatusBadge({ status = 'pending' }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize">{status}</span>
}
