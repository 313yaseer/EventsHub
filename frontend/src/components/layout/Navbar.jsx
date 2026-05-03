import { Bell } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

function getDaysLeft(date) {
  if (!date) return 0

  const endsAt = new Date(date)
  const now = new Date()
  const diff = endsAt.getTime() - now.getTime()

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatCurrentDate() {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

export default function Navbar({ title }) {
  const tenant = useAuthStore((state) => state.tenant)
  const isTrialing = tenant?.plan_status === 'trialing'
  const daysLeft = getDaysLeft(tenant?.trial_ends_at)

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
      <h1 className="truncate text-lg font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-4">
        {isTrialing ? (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-3 py-1 text-sm font-medium text-amber-400">
            {daysLeft} days left
          </span>
        ) : null}

        <button
          type="button"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        <time className="hidden text-sm text-slate-400 sm:block" dateTime={new Date().toISOString()}>
          {formatCurrentDate()}
        </time>
      </div>
    </header>
  )
}
