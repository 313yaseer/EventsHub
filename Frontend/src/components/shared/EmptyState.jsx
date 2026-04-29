export default function EmptyState({ title = 'Nothing here yet' }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">{title}</div>
}
