import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { impersonate, getTenantDetail, updateTenantStatus } from '../../api/adminApi'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import StatusBadge from '../../components/shared/StatusBadge'
import { useAuthStore } from '../../store/authStore'

function payload(response) {
  return response?.data ?? response ?? {}
}

function money(value = 0) {
  return `₦${new Intl.NumberFormat('en-NG').format(Number(value) || 0)}`
}

function dateText(date) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
}

function Stat({ label, value }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </Card>
  )
}

export default function TenantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const startImpersonation = useAuthStore((state) => state.startImpersonation)
  const [confirmImpersonate, setConfirmImpersonate] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['admin-tenant', id], queryFn: () => getTenantDetail(id) })
  const detail = payload(data)
  const tenant = detail.tenant ?? detail
  const stats = detail.stats ?? tenant.stats ?? {}

  const statusMutation = useMutation({
    mutationFn: (status) => updateTenantStatus(id, { status }),
    onSuccess: () => {
      toast.success('Tenant status updated')
      queryClient.invalidateQueries({ queryKey: ['admin-tenant', id] })
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  const impersonateMutation = useMutation({
    mutationFn: () => impersonate(id),
    onSuccess: async (response) => {
      const token = response?.token ?? response?.data?.token ?? response?.access_token
      await startImpersonation(token, tenant.business_name)
      navigate('/dashboard')
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  if (isLoading) return <p className="text-slate-400">Loading tenant...</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {tenant.logo_url ? <img src={tenant.logo_url} alt="" className="h-14 w-14 rounded-xl object-contain" /> : <div className="h-14 w-14 rounded-xl bg-slate-800" />}
          <div>
            <h1 className="text-2xl font-semibold text-white">{tenant.business_name}</h1>
            <div className="mt-2 flex gap-2">
              <StatusBadge status={tenant.plan} type="plan" />
              <StatusBadge status={tenant.plan_status ?? tenant.status} type="plan" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setConfirmImpersonate(true)}>Impersonate</Button>
          <Button variant="danger" loading={statusMutation.isPending} onClick={() => statusMutation.mutate('suspended')}>Suspend</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total Bookings" value={stats.total_bookings ?? 0} />
        <Stat label="Total Events" value={stats.total_events ?? 0} />
        <Stat label="Team Members" value={stats.team_members ?? 0} />
        <Stat label="Monthly Revenue" value={money(stats.monthly_revenue)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card title="Business Info">
            <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
              <p>Owner: {tenant.owner?.email ?? tenant.owner_email ?? '-'}</p>
              <p>Phone: {tenant.phone ?? '-'}</p>
              <p>Address: {tenant.address ?? '-'}</p>
              <p>Website: {tenant.website ?? '-'}</p>
            </div>
          </Card>
          <Card title="Subscription Details">
            <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
              <p>Stripe Customer: {tenant.stripe_customer_id ?? '-'}</p>
              <p>Subscription: {tenant.stripe_subscription_id ?? '-'}</p>
              <p>Plan: {tenant.plan ?? '-'}</p>
              <p>Trial Ends: {dateText(tenant.trial_ends_at)}</p>
            </div>
          </Card>
          <Card title="Team Members list">
            <Table
              data={detail.team_members ?? tenant.team_members ?? []}
              columns={[
                { key: 'name', label: 'Name', render: (row) => row.full_name ?? row.name },
                { key: 'email', label: 'Email' },
                { key: 'role', label: 'Role' },
              ]}
            />
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Recent Activity">
            <Table
              data={(detail.audit_entries ?? []).slice(0, 10)}
              columns={[
                { key: 'time', label: 'Time', render: (row) => dateText(row.created_at) },
                { key: 'action', label: 'Action' },
                { key: 'actor', label: 'Actor', render: (row) => row.actor_email ?? '-' },
              ]}
            />
          </Card>
          <Card title="Recent Bookings">
            <Table
              data={(detail.recent_bookings ?? []).slice(0, 5)}
              columns={[
                { key: 'event_name', label: 'Event' },
                { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
                { key: 'date', label: 'Date', render: (row) => dateText(row.date ?? row.event_date) },
              ]}
            />
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmImpersonate}
        onClose={() => setConfirmImpersonate(false)}
        onConfirm={() => impersonateMutation.mutate()}
        title="Impersonate account?"
        message="You are about to impersonate this account. All actions taken will be logged. A 2-hour session token will be generated."
        confirmLabel="Start Impersonation"
        loading={impersonateMutation.isPending}
      />
    </div>
  )
}
