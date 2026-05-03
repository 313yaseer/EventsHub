import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { getAuditLog } from '../../api/adminApi'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'

function payload(response) {
  return response?.data ?? response ?? {}
}

function dateTime(date) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export default function AuditLog() {
  const [filters, setFilters] = useState({ tenant: '', action: '', date_from: '', date_to: '' })
  const params = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), [filters])
  const { data, isLoading, refetch, dataUpdatedAt, isFetching } = useQuery({
    queryKey: ['admin-audit', params],
    queryFn: () => getAuditLog(params),
    refetchInterval: 30000,
  })
  const rows = payload(data).logs ?? payload(data).data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Audit Log</h1>
          <p className="mt-1 text-sm text-slate-400">
            Last updated: {dataUpdatedAt ? dateTime(dataUpdatedAt) : 'Never'}
          </p>
        </div>
        <Button variant="outline" loading={isFetching} icon={<RefreshCw className="h-4 w-4" />} onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-4">
          <Input placeholder="Tenant search" name="tenant" value={filters.tenant} onChange={(e) => setFilters((c) => ({ ...c, tenant: e.target.value }))} />
          <Select
            name="action"
            value={filters.action}
            onChange={(e) => setFilters((c) => ({ ...c, action: e.target.value }))}
            options={[{ value: '', label: 'All actions' }, { value: 'login', label: 'Login' }, { value: 'update', label: 'Update' }, { value: 'delete', label: 'Delete' }, { value: 'impersonate', label: 'Impersonate' }]}
          />
          <Input type="date" name="date_from" value={filters.date_from} onChange={(e) => setFilters((c) => ({ ...c, date_from: e.target.value }))} />
          <Input type="date" name="date_to" value={filters.date_to} onChange={(e) => setFilters((c) => ({ ...c, date_to: e.target.value }))} />
        </div>
      </Card>

      <Card>
        <Table
          loading={isLoading}
          data={rows}
          columns={[
            { key: 'timestamp', label: 'Timestamp', render: (row) => dateTime(row.created_at ?? row.timestamp) },
            { key: 'actor_email', label: 'Actor Email' },
            { key: 'tenant', label: 'Tenant', render: (row) => row.tenant_name ?? row.tenant?.business_name ?? '-' },
            { key: 'action', label: 'Action', render: (row) => <Badge variant="info">{row.action}</Badge> },
            { key: 'resource', label: 'Resource', render: (row) => row.resource ?? row.resource_type ?? '-' },
            { key: 'ip', label: 'IP', render: (row) => row.ip_address ?? row.ip ?? '-' },
          ]}
        />
      </Card>
    </div>
  )
}
