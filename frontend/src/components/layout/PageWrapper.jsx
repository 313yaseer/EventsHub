import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PageWrapper({
  title,
  subtitle,
  actions,
  children,
  backTo,
  backLabel = 'Back',
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {backTo ? (
            <Link
              to={backTo}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          ) : null}

          {title ? <h1 className="text-2xl font-semibold text-slate-100">{title}</h1> : null}
          {subtitle ? <p className="mt-2 text-sm text-slate-400">{subtitle}</p> : null}
        </div>

        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>

      <div className="space-y-6">{children}</div>
    </section>
  )
}
