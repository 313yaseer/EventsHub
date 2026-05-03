import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Eye } from 'lucide-react'
import { getTenants, updateTenantPlan, updateTenantStatus } from '../../api/adminApi'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import StatusBadge from '../../components/shared/StatusBadge'

function payload(response) {
  return response?.data ?? response ?? {}
}

function dateText(date) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
}

export default function TenantsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ search: '', plan: '', status: '' })
  const params = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), [filters])
  const { data, isLoading } = useQuery({ queryKey: ['admin-tenants', params], queryFn: () => getTenants(params) })
  const dataPayload = payload(data)
  const tenants = dataPayload.tenants ?? dataPayload.data ?? []
  const total = dataPayload.total ?? tenants.length

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-tenants'] })
  const planMutation = useMutation({
    mutationFn: ({ id, plan }) => updateTenantPlan(id, { plan }),
    onSuccess: () => {
      toast.success('Plan updated')
      invalidate()
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateTenantStatus(id, { status }),
    onSuccess: () => {
      toast.success('Tenant status updated')
      invalidate()
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">All Tenants</h1>
        <p className="mt-1 text-sm text-slate-400">{total} tenants found</p>
      </div>
      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Input placeholder="Search tenants" name="search" value={filters.search} onChange={(e) => setFilters((c) => ({ ...c, search: e.target.value }))} />
          <Select name="plan" value={filters.plan} onChange={(e) => setFilters((c) => ({ ...c, plan: e.target.value }))} options={[{ value: '', label: 'All plans' }, { value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }, { value: 'enterprise', label: 'Enterprise' }]} />
          <Select name="status" value={filters.status} onChange={(e) => setFilters((c) => ({ ...c, status: e.target.value }))} options={[{ value: '', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }, { value: 'trialing', label: 'Trialing' }]} />
        </div>
      </Card>
      <Card>
        <Table
          loading={isLoading}
          data={tenants}
          columns={[
            { key: 'business_name', label: 'Business Name' },
            { key: 'owner', label: 'Owner', render: (row) => row.owner?.email ?? row.owner_email ?? '-' },
            { key: 'plan', label: 'Plan badge', render: (row) => <StatusBadge status={row.plan} type="plan" /> },
            { key: 'plan_status', label: 'Plan Status', render: (row) => <StatusBadge status={row.plan_status} type="plan" /> },
            { key: 'bookings', label: 'Bookings', render: (row) => row.bookings_count ?? 0 },
            { key: 'events', label: 'Events', render: (row) => row.events_count ?? 0 },
            { key: 'team', label: 'Team', render: (row) => row.team_count ?? row.team_members_count ?? 0 },
            { key: 'joined', label: 'Joined', render: (row) => dateText(row.created_at) },
            {
              key: 'actions',
              label: 'Actions',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" icon={<Eye className="h-4 w-4" />} onClick={() => navigate(`/admin/tenants/${row.id}`)}>View</Button>
                  <select
                    value={row.plan ?? 'free'}
                    onChange={(e) => planMutation.mutate({ id: row.id, plan: e.target.value })}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                  <Button
                    size="sm"
                    variant={row.status === 'suspended' ? 'success' : 'danger'}
                    onClick={() => statusMutation.mutate({ id: row.id, status: row.status === 'suspended' ? 'active' : 'suspended' })}
                  >
                    {row.status === 'suspended' ? 'Activate' : 'Suspend'}
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
