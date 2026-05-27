import { Link, NavLink, Outlet } from 'react-router-dom'
import { Building2, LayoutDashboard, ScrollText, Shield } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { label: 'Overview', to: '/admin/overview', icon: LayoutDashboard },
  { label: 'All Tenants', to: '/admin/tenants', icon: Building2 },
  { label: 'Audit Log', to: '/admin/audit', icon: ScrollText },
]

export default function AdminLayout() {
  const user = useAuthStore((state) => state.user)
  const isImpersonating = useAuthStore((state) => state.isImpersonating)
  const appLink = isImpersonating ? '/dashboard' : '/admin/tenants'

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-red-600" />
      <aside className="fixed left-0 top-1 flex h-[calc(100vh-0.25rem)] w-64 flex-col border-r border-slate-800 bg-slate-950">
        <div className="border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-white">EventsHub Admin</p>
              <p className="text-xs text-slate-500">Super admin console</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 px-5 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-red-500/15 text-red-300'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white',
                  ].join(' ')
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-slate-800 p-5">
          <Link to={appLink} className="mb-2 inline-flex text-sm text-slate-400 hover:text-white">
            ← {isImpersonating ? 'Back to App' : 'Select Tenant App'}
          </Link>
          {!isImpersonating ? (
            <p className="mb-5 text-xs leading-5 text-slate-500">
              Super admins must impersonate a tenant before opening the tenant app.
            </p>
          ) : null}
          <p className="truncate text-sm font-medium text-slate-100">{user?.full_name ?? 'Super Admin'}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
        </div>
      </aside>

      <main className="min-h-screen pl-64">
        <div className="mx-auto max-w-7xl p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
