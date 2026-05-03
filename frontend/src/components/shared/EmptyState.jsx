export default function EmptyState({
  icon,
  title = 'Nothing here yet',
  message,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 px-6 py-10 text-center">
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-slate-400">
          {icon}
        </div>
      ) : null}

      <h3 className="text-base font-semibold text-slate-100">{title}</h3>

      {message ? <p className="mt-2 max-w-sm text-sm text-slate-400">{message}</p> : null}

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
