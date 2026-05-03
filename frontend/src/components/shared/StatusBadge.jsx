import Badge from '../ui/Badge'

const statusVariants = {
  booking: {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    cancelled: 'neutral',
  },
  event: {
    upcoming: 'info',
    ongoing: 'success',
    completed: 'neutral',
    cancelled: 'danger',
  },
  payment: {
    unpaid: 'danger',
    partial: 'warning',
    paid: 'success',
  },
  plan: {
    free: 'neutral',
    pro: 'primary',
    enterprise: 'warning',
  },
}

function formatStatus(status) {
  return String(status ?? '')
    .replace(/[_-]/g, ' ')
    .trim()
}

export default function StatusBadge({ status, type = 'booking' }) {
  const normalizedStatus = String(status ?? '').toLowerCase()
  const variant = statusVariants[type]?.[normalizedStatus] ?? 'neutral'

  return (
    <Badge variant={variant}>
      <span className="capitalize">{formatStatus(status)}</span>
    </Badge>
  )
}
