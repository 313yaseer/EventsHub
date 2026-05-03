import { NavLink, useParams } from 'react-router-dom'
import {
  Bell,
  Briefcase,
  Building2,
  CreditCard,
  Palette,
  User,
  Users,
} from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import ProfileTab from './tabs/ProfileTab'
import BusinessTab from './tabs/BusinessTab'
import BrandingTab from './tabs/BrandingTab'
import TeamTab from './tabs/TeamTab'
import HallsTab from './tabs/HallsTab'
import NotificationsTab from './tabs/NotificationsTab'
import BillingTab from './tabs/BillingTab'

const tabs = [
  { key: 'profile', label: 'Profile', icon: User, component: ProfileTab },
  { key: 'business', label: 'Business', icon: Building2, component: BusinessTab },
  { key: 'branding', label: 'Branding', icon: Palette, component: BrandingTab },
  { key: 'team', label: 'Team', icon: Users, component: TeamTab },
  { key: 'halls', label: 'Halls', icon: Briefcase, component: HallsTab },
  { key: 'notifications', label: 'Notifications', icon: Bell, component: NotificationsTab },
  { key: 'billing', label: 'Billing', icon: CreditCard, component: BillingTab },
]

export default function Settings() {
  const { tab = 'profile' } = useParams()
  const activeTab = tabs.find((item) => item.key === tab) ?? tabs[0]
  const ActiveComponent = activeTab.component

  return (
    <PageWrapper title="Settings">
      <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
        <aside className="h-fit rounded-xl border border-slate-700 bg-slate-800 p-2">
          <nav className="space-y-1">
            {tabs.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.key}
                  to={`/settings/${item.key}`}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                      isActive || (tab === undefined && item.key === 'profile')
                        ? 'bg-[var(--primary)] text-white'
                        : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100',
                    ].join(' ')
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          <ActiveComponent />
        </div>
      </div>
    </PageWrapper>
  )
}
