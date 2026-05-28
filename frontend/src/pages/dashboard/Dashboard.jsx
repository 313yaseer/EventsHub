import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart as ReBarChart,
  Bar,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BookOpen,
  Calendar,
  CalendarCheck,
  Clock,
  Eye,
  MapPin,
  TrendingUp,
} from 'lucide-react'
import * as reportsApi from '../../api/reportsApi'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import EmptyState from '../../components/shared/EmptyState'
import StatusBadge from '../../components/shared/StatusBadge'
import PageWrapper from '../../components/layout/PageWrapper'
import { useAuthStore } from '../../store/authStore'

function getStatsPayload(data) {
  const payload = data?.data ?? data ?? {}

  return payload.stats ?? payload
}

function formatNumber(value = 0) {
  return new Intl.NumberFormat('en-NG').format(Number(value) || 0)
}

function formatCompactCurrency(value = 0) {
  const amount = Number(value) || 0

  if (amount >= 1000000) return `${Math.round(amount / 1000000)}m`
  if (amount >= 1000) return `${Math.round(amount / 1000)}k`
  return `${amount}`
}

function formatDate(date) {
  if (!date) return '-'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function getGreeting() {
  const hour = new Date().getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getFirstName(fullName = '') {
  return fullName.split(' ').filter(Boolean)[0] || 'there'
}

function getTrialDaysLeft(trialEndsAt) {
  if (!trialEndsAt) return 0

  const diff = new Date(trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function StatSkeleton() {
  return (
    <Card>
      <div className="animate-pulse">
        <div className="mb-6 h-11 w-11 rounded-xl bg-slate-700" />
        <div className="h-4 w-32 rounded bg-slate-700" />
        <div className="mt-4 h-8 w-20 rounded bg-slate-700" />
        <div className="mt-4 h-4 w-28 rounded bg-slate-700" />
      </div>
    </Card>
  )
}

function StatCard({ icon: Icon, iconClassName, label, value, sub, highlight }) {
  return (
    <Card className={highlight ? 'border-amber-500/50 shadow-[0_0_28px_rgba(245,158,11,0.15)]' : ''}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
          <div className="mt-3 text-sm text-slate-400">{sub}</div>
        </div>
        <div className={['flex h-11 w-11 items-center justify-center rounded-xl', iconClassName].join(' ')}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm shadow-xl">
      <p className="mb-2 font-medium text-slate-100">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="text-slate-300">
          <span style={{ color: item.color }}>{item.name}:</span> ₦{formatNumber(item.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const tenant = useAuthStore((state) => state.tenant)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: reportsApi.getDashboardStats,
    refetchInterval: 5 * 60 * 1000,
  })

  const stats = getStatsPayload(data)
  const monthlyRevenue = stats.monthly_revenue ?? []
  const todaysEvents = stats.todays_events ?? stats.today_events ?? []
  const recentBookings = (stats.recent_bookings ?? []).slice(0, 5)
  const pendingBookings = Number(stats.pending_bookings) || 0
  const outstanding = Number(stats.outstanding_revenue ?? stats.outstanding) || 0
  const todaysEventCount =
    Number(stats.events_today ?? stats.happening_today ?? todaysEvents.length) || 0
  const isUpgradeVisible =
    String(tenant?.plan ?? '').toLowerCase() === 'free' || tenant?.plan_status === 'trialing'

  const bookingColumns = [
    {
      key: 'client',
      label: 'Client',
      render: (booking) => booking.client_name ?? booking.client?.name ?? '-',
    },
    {
      key: 'event_name',
      label: 'Event Name',
      render: (booking) => booking.event_name ?? booking.event?.name ?? '-',
    },
    { key: 'type', label: 'Type', render: (booking) => booking.type ?? booking.event_type ?? '-' },
    { key: 'date', label: 'Date', render: (booking) => formatDate(booking.date ?? booking.event_date) },
    {
      key: 'status',
      label: 'Status',
      render: (booking) => <StatusBadge status={booking.status} type="booking" />,
    },
    {
      key: 'payment',
      label: 'Payment',
      render: (booking) => <StatusBadge status={booking.payment_status} type="payment" />,
    },
    {
      key: 'action',
      label: 'Action',
      render: (booking) => (
        <button
          type="button"
          onClick={() => navigate(`/bookings/${booking.id}`)}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-700 hover:text-slate-100"
          aria-label="View booking"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <PageWrapper
      title="Dashboard"
      subtitle={`${getGreeting()}, ${getFirstName(user?.full_name)} 👋`}
    >
      <p className="-mt-4 text-sm text-slate-500">
        {new Intl.DateTimeFormat('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date())}
      </p>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={BookOpen}
              iconClassName="bg-indigo-500/20 text-indigo-300"
              label="Bookings This Month"
              value={stats.bookings_this_month ?? 0}
              sub={
                <Link to="/bookings?status=pending" className="hover:text-slate-100">
                  {pendingBookings} pending approval
                </Link>
              }
            />
            <StatCard
              icon={CalendarCheck}
              iconClassName="bg-blue-500/20 text-blue-300"
              label="Upcoming Events"
              value={stats.upcoming_events ?? 0}
              sub={
                <span className={todaysEventCount > 0 ? 'text-emerald-400' : ''}>
                  {todaysEventCount} happening today
                </span>
              }
            />
            <StatCard
              icon={TrendingUp}
              iconClassName="bg-emerald-500/20 text-emerald-300"
              label="Revenue This Month"
              value={`₦${formatNumber(stats.revenue_this_month)}`}
              sub={<span className="text-amber-400">₦{formatNumber(outstanding)} outstanding</span>}
            />
            <StatCard
              icon={Clock}
              iconClassName="bg-amber-500/20 text-amber-300"
              label="Pending Approvals"
              value={pendingBookings}
              sub="Require your attention"
              highlight={pendingBookings > 0}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <Card title="Revenue Overview">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={monthlyRevenue}>
                <CartesianGrid stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₦${formatCompactCurrency(value)}`}
                />
                <Tooltip content={<RevenueTooltip />} cursor={{ fill: 'rgba(51,65,85,0.35)' }} />
                <Legend wrapperStyle={{ paddingTop: 16 }} />
                <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="outstanding" name="Outstanding" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Today's Events">
          {todaysEvents.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-6 w-6" />}
              title="No events today"
              message="Your schedule is clear for today."
            />
          ) : (
            <div className="space-y-4">
              {todaysEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-slate-700 bg-slate-900 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-100">
                        {event.name ?? event.event_name ?? '-'}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {event.start_time} → {event.end_time}
                      </p>
                    </div>
                    <StatusBadge status={event.status} type="event" />
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{event.hall_name ?? event.hall?.name ?? '-'}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Badge variant="info">{event.attendee_count ?? 0} attendees</Badge>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/events/${event.id}`)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card
        title="Recent Bookings"
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/bookings')}>
            View All
          </Button>
        }
      >
        <Table
          columns={bookingColumns}
          data={recentBookings}
          loading={isLoading}
          emptyMessage="No recent bookings"
        />
      </Card>

      {isUpgradeVisible ? (
        <div className="overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/20 via-slate-800 to-indigo-500/20 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">⚡ You&apos;re on the Free plan</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Upgrade to Pro for ₦15,000/month for unlimited bookings, exports, and custom
                branding.
              </p>
              {tenant?.plan_status === 'trialing' ? (
                <p className="mt-2 text-sm text-amber-300">
                  {getTrialDaysLeft(tenant.trial_ends_at)} days left in your trial.
                </p>
              ) : null}
            </div>
            <Button size="lg" onClick={() => navigate('/settings/billing')}>
              Upgrade Now
            </Button>
          </div>
        </div>
      ) : null}
    </PageWrapper>
  )
}
