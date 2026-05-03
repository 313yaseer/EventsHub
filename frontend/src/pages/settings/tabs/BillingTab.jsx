import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createPortal, getBilling, getPlans } from '../../../api/billingApi'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import StatusBadge from '../../../components/shared/StatusBadge'
import { useAuthStore } from '../../../store/authStore'

function payload(response) {
  return response?.data ?? response ?? {}
}

export default function BillingTab() {
  const tenant = useAuthStore((state) => state.tenant)
  const { data } = useQuery({ queryKey: ['billing'], queryFn: getBilling })
  const { data: plansData } = useQuery({ queryKey: ['plans'], queryFn: getPlans })
  const billing = payload(data)
  const plans = payload(plansData).plans ?? []

  const portalMutation = useMutation({
    mutationFn: createPortal,
    onSuccess: (response) => {
      const url = response?.url ?? response?.data?.url
      if (url) window.location.href = url
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  return (
    <div className="space-y-6">
      <Card title="Current Plan" actions={<StatusBadge status={tenant?.plan ?? 'free'} type="plan" />}>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-slate-400">Plan</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">{tenant?.plan ?? 'Free'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Status</p>
            <p className="mt-1 text-slate-100">{tenant?.plan_status ?? billing.status ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Trial Ends</p>
            <p className="mt-1 text-slate-100">{tenant?.trial_ends_at ?? '-'}</p>
          </div>
        </div>
        <Button className="mt-6" loading={portalMutation.isPending} onClick={() => portalMutation.mutate()}>
          Manage Billing
        </Button>
      </Card>

      <Card title="Available Plans">
        <div className="grid gap-4 md:grid-cols-3">
          {plans.length ? plans.map((plan) => (
            <div key={plan.id ?? plan.name} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <p className="font-semibold text-slate-100">{plan.name}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">{plan.price ?? plan.amount ?? '-'}</p>
              <p className="mt-2 text-sm text-slate-400">{plan.description}</p>
            </div>
          )) : (
            <p className="text-sm text-slate-400">Plan details will appear here.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
