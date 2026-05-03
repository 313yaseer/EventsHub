import {
  BarChart3,
  BookOpen,
  Calendar,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  ScanLine,
  Settings,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Bookings', to: '/bookings', icon: BookOpen },
  { label: 'Upcoming Events', to: '/events', icon: CalendarCheck },
  { label: 'Calendar', to: '/calendar', icon: Calendar },
  { label: 'Reports', to: '/reports', icon: BarChart3 },
  { label: 'QR Scanner', to: '/scan', icon: ScanLine },
]

const planStyles = {
  free: 'border-slate-600 bg-slate-700 text-slate-300',
  pro: 'border-indigo-500/30 bg-indigo-500/20 text-indigo-300',
  enterprise: 'border-amber-500/30 bg-amber-500/20 text-amber-300',
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function SidebarLink({ item }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 border-r-2 px-4 py-2.5 text-sm font-medium transition',
          isActive
            ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_20%,transparent)] text-[var(--primary)]'
            : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-100',
        ].join(' ')
      }
    >
      <Icon className="h-5 w-5" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  )
}

export default function Sidebar() {
  const { user, tenant, logout } = useAuthStore()
  const businessName = tenant?.business_name ?? 'EventsHub'
  const businessInitials = getInitials(businessName) || 'EH'
  const userName = user?.full_name ?? 'User'
  const userInitials = getInitials(userName) || 'U'
  const plan = tenant?.plan ?? 'Free'
  const planClass = planStyles[String(plan).toLowerCase()] ?? planStyles.free

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 p-5">
        <div className="flex min-h-10 items-center">
          {tenant?.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={businessName}
              className="max-h-10 max-w-full object-contain"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
              {businessInitials}
            </div>
          )}
        </div>

        <div className="mt-3">
          <p className="truncate text-sm font-semibold text-slate-100">{businessName}</p>
          <span
            className={[
              'mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
              planClass,
            ].join(' ')}
          >
            {plan}
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 py-4">
        {navItems.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
      </nav>

      <div className="border-t border-slate-800">
        <div className="py-3">
          <SidebarLink item={{ label: 'Settings', to: '/settings', icon: Settings }} />
        </div>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={userName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-slate-100">
                {userInitials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-100">{userName}</p>
              {user?.role ? (
                <span className="mt-1 inline-flex rounded-full border border-slate-600 bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-400">
                  {user.role}
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}
