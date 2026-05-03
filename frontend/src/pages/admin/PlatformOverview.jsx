import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { getPlatformStats } from '../../api/adminApi'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import StatusBadge from '../../components/shared/StatusBadge'

const colors = ['#64748b', '#6366f1', '#f59e0b']

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

export default function PlatformOverview() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: getPlatformStats })
  const stats = payload(data)
  const recent = stats.recent_signups ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Platform Overview</h1>
        <p className="mt-1 text-sm text-slate-400">System-wide tenant and revenue metrics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Stat label="Total Tenants" value={stats.total_tenants ?? 0} />
        <Stat label="Paying" value={stats.paying ?? 0} />
        <Stat label="Free" value={stats.free ?? 0} />
        <Stat label="MRR" value={money(stats.mrr)} />
        <Stat label="New This Month" value={stats.new_this_month ?? 0} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Tenants by plan">
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={stats.tenants_by_plan ?? []} dataKey="value" nameKey="name" outerRadius={95} label>
                  {(stats.tenants_by_plan ?? []).map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="New signups last 30 days">
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={stats.signups_last_30_days ?? []}>
                <CartesianGrid stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Recent signups">
        <Table
          loading={isLoading}
          data={recent}
          columns={[
            { key: 'business_name', label: 'Business Name' },
            { key: 'owner_email', label: 'Owner Email' },
            { key: 'plan', label: 'Plan', render: (row) => <StatusBadge status={row.plan} type="plan" /> },
            { key: 'signed_up', label: 'Signed Up', render: (row) => dateText(row.created_at ?? row.signed_up_at) },
            { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.plan_status ?? row.status} type="plan" /> },
            { key: 'actions', label: 'Actions', render: (row) => <Button size="sm" variant="outline" onClick={() => navigate(`/admin/tenants/${row.id}`)}>View</Button> },
          ]}
        />
      </Card>
    </div>
  )
}
