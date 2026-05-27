import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Check, Download, X } from 'lucide-react'
import {
  cancelSubscription,
  createCheckout,
  createPortal,
  getBilling,
  getPlans,
} from '../../../api/billingApi'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Table from '../../../components/ui/Table'
import ConfirmDialog from '../../../components/shared/ConfirmDialog'
import StatusBadge from '../../../components/shared/StatusBadge'
import UsageBar from '../../../components/shared/UsageBar'
import { useAuthStore } from '../../../store/authStore'

const featureRows = [
  ['Bookings/month', 'bookings'],
  ['Events/month', 'events'],
  ['Attendees/event', 'attendees_per_event'],
  ['Team members', 'team_members'],
  ['Halls', 'halls'],
  ['Export reports', 'exports'],
  ['Custom branding', 'branding'],
  ['API access', 'api_access'],
]

function payload(response) {
  return response?.data ?? response ?? {}
}

function money(value = 0) {
  if (value === 0 || value === '0') return 'Free'
  return `₦${new Intl.NumberFormat('en-NG').format(Number(value) || 0)}/month`
}

function dateText(date) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

function daysLeft(date) {
  if (!date) return 0
  const diff = new Date(date).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function featureValue(value) {
  if (value === true) return <Check className="h-4 w-4 text-emerald-400" />
  if (value === false || value == null) return <X className="h-4 w-4 text-red-400" />
  if (value === -1) return 'Unlimited'
  return value
}

export default function BillingTab() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const tenant = useAuthStore((state) => state.tenant)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [checkoutPlan, setCheckoutPlan] = useState(null)

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription activated! 🎉')
    }
    if (searchParams.get('cancelled') === 'true') {
      toast('Checkout cancelled')
    }
  }, [searchParams])

  const { data: billingData, isLoading: billingLoading } = useQuery({
    queryKey: ['billing'],
    queryFn: getBilling,
  })
  const { data: plansData } = useQuery({ queryKey: ['billing-plans'], queryFn: getPlans })

  const billing = payload(billingData)
  const plansPayload = payload(plansData)
  const subscription = billing.subscription ?? billing
  const invoices = billing.invoices ?? []
  const usage = billing.usage ?? billing.usageGuard ?? {}
  const plans = plansPayload.plans ?? [
    { key: 'free', name: 'Free', price: 0, features: { bookings: 10, events: 2, attendees_per_event: 50, team_members: 1, halls: 1, exports: false, branding: false, api_access: false } },
    { key: 'pro', name: 'Pro', price: 15000, features: { bookings: -1, events: -1, attendees_per_event: -1, team_members: 5, halls: 5, exports: true, branding: true, api_access: false } },
    { key: 'enterprise', name: 'Enterprise', price: 0, features: { bookings: -1, events: -1, attendees_per_event: -1, team_members: -1, halls: -1, exports: true, branding: true, api_access: true } },
  ]
  const plan = String(tenant?.plan ?? subscription.plan ?? 'free').toLowerCase()
  const planStatus = tenant?.plan_status ?? subscription.status ?? 'free'

  const portalMutation = useMutation({
    mutationFn: createPortal,
    onSuccess: (response) => {
      const url = response?.portal_url ?? response?.url ?? response?.data?.url
      if (url) window.location.href = url
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  const checkoutMutation = useMutation({
    mutationFn: createCheckout,
    onMutate: (selectedPlan) => setCheckoutPlan(selectedPlan),
    onSuccess: (response) => {
      const url = response?.checkout_url ?? response?.url ?? response?.data?.url
      if (url) window.location.href = url
    },
    onError: (error) => {
      setCheckoutPlan(null)
      toast.error(error?.response?.data?.message ?? error.message)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      toast.success('Subscription cancellation scheduled')
      setCancelOpen(false)
      queryClient.invalidateQueries({ queryKey: ['billing'] })
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  const invoiceColumns = [
    { key: 'date', label: 'Date', render: (row) => dateText(row.date ?? row.created_at) },
    { key: 'description', label: 'Description', render: (row) => row.description ?? row.plan_name ?? 'Subscription invoice' },
    { key: 'amount', label: 'Amount', render: (row) => `₦${new Intl.NumberFormat('en-NG').format(Number(row.amount ?? row.total ?? 0))}` },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'paid' ? 'success' : row.status === 'open' ? 'warning' : 'neutral'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'download',
      label: 'Download',
      render: (row) =>
        row.pdf_url ?? row.invoice_pdf ? (
          <a
            href={row.pdf_url ?? row.invoice_pdf}
            className="inline-flex items-center gap-2 text-sm font-medium text-(--primary)"
            target="_blank"
            rel="noreferrer"
          >
            <Download className="h-4 w-4" />
            PDF
          </a>
        ) : (
          '-'
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <Card title="Current Plan">
        {planStatus === 'past_due' ? (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/15 p-4 text-sm text-red-200">
            ⚠ Payment failed
            <Button className="ml-4" size="sm" variant="danger" onClick={() => portalMutation.mutate()}>
              Update payment method
            </Button>
          </div>
        ) : null}

        {planStatus === 'cancelled' ? (
          <div className="mb-5 rounded-lg border border-slate-600 bg-slate-700 p-4 text-sm text-slate-300">
            Subscription cancelled at period end
          </div>
        ) : null}

        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={plan} type="plan" />
              <Badge variant={planStatus === 'active' || planStatus === 'trialing' ? 'success' : 'neutral'}>
                {planStatus}
              </Badge>
            </div>

            {plan === 'free' ? (
              <div className="mt-4">
                <p className="text-2xl font-semibold text-slate-100">You are on the Free Plan</p>
                {planStatus === 'trialing' ? (
                  <p className="mt-2 text-sm text-amber-400">
                    14-day trial: {daysLeft(tenant?.trial_ends_at)} days remaining
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-2xl font-semibold text-slate-100">{plan} plan</p>
                <p className="mt-2 text-sm text-slate-400">
                  Next billing: {dateText(subscription.current_period_end)}
                </p>
              </div>
            )}
          </div>

          {plan !== 'free' ? (
            <div className="flex flex-col items-start gap-3 md:items-end">
              <Button loading={portalMutation.isPending} onClick={() => portalMutation.mutate()}>
                Manage billing & invoices
              </Button>
              <button
                type="button"
                onClick={() => setCancelOpen(true)}
                className="text-sm font-medium text-red-400 hover:text-red-300"
              >
                Cancel subscription
              </button>
            </div>
          ) : null}
        </div>
      </Card>

      <Card title="Plan Usage">
        <div className="grid gap-5 md:grid-cols-2">
          <UsageBar label="Bookings" used={usage.bookings?.used ?? 0} limit={usage.bookings?.limit ?? 0} />
          <UsageBar label="Events" used={usage.events?.used ?? 0} limit={usage.events?.limit ?? 0} />
          <UsageBar label="Team Members" used={usage.team_members?.used ?? 0} limit={usage.team_members?.limit ?? 0} />
          <UsageBar label="Halls" used={usage.halls?.used ?? 0} limit={usage.halls?.limit ?? 0} />
        </div>
      </Card>

      <Card title="Choose the right plan for your center">
        <div className="grid gap-5 xl:grid-cols-3">
          {plans.map((planItem) => {
            const key = String(planItem.key ?? planItem.slug ?? planItem.name).toLowerCase()
            const isCurrent = key === plan
            const features = planItem.features ?? {}
            const highlighted = key === 'pro'

            return (
              <div
                key={key}
                className={[
                  'rounded-xl border bg-slate-900 p-5',
                  highlighted ? 'border-(--primary) shadow-[0_0_30px_rgba(var(--primary-rgb),0.18)]' : 'border-slate-700',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-100">{planItem.name}</h3>
                    <p className="mt-2 text-2xl font-semibold text-slate-100">
                      {money(planItem.price ?? planItem.amount)}
                    </p>
                  </div>
                  {isCurrent ? <Badge variant="success">Current Plan</Badge> : null}
                </div>

                <div className="mt-6 space-y-3">
                  {featureRows.map(([label, featureKey]) => (
                    <div key={featureKey} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-400">{label}</span>
                      <span className="font-medium text-slate-100">{featureValue(features[featureKey])}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="mt-6 w-full"
                  variant={isCurrent ? 'outline' : 'primary'}
                  disabled={isCurrent}
                  loading={checkoutMutation.isPending && checkoutPlan === key}
                  onClick={() => checkoutMutation.mutate(key)}
                >
                  {isCurrent ? 'Current Plan' : `Upgrade to ${planItem.name}`}
                </Button>
              </div>
            )
          })}
        </div>
      </Card>

      <Card title="Billing History">
        {invoices.length === 0 && !billingLoading ? (
          <p className="text-sm text-slate-400">No invoices yet. Invoices appear after payment.</p>
        ) : (
          <Table columns={invoiceColumns} data={invoices} loading={billingLoading} />
        )}
      </Card>

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel subscription?"
        message="Your subscription will remain active until the end of the current billing period."
        confirmLabel="Cancel subscription"
        danger
        loading={cancelMutation.isPending}
      />
    </div>
  )
}
