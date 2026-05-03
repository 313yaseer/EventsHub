import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { updateNotifications } from '../../../api/settingsApi'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Toggle from '../../../components/ui/Toggle'

const items = [
  ['new_booking', 'New booking submitted', 'Get notified when a new booking is created'],
  ['payment_received', 'Payment received', "When a client's payment is marked as received"],
  ['event_reminder', 'Event reminder', '24 hours before each event'],
  ['low_usage_warning', 'Low usage warning', 'When approaching plan limits'],
]

export default function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    new_booking: true,
    payment_received: true,
    event_reminder: true,
    low_usage_warning: true,
  })

  const mutation = useMutation({
    mutationFn: updateNotifications,
    onSuccess: () => toast.success('Notification preferences saved'),
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  return (
    <Card title="Email Notifications">
      <div className="divide-y divide-slate-700">
        {items.map(([key, title, description]) => (
          <div key={key} className="flex items-center justify-between gap-5 py-5 first:pt-0 last:pb-0">
            <div>
              <p className="font-medium text-slate-100">{title}</p>
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            </div>
            <Toggle
              checked={prefs[key]}
              onChange={(value) => setPrefs((current) => ({ ...current, [key]: value }))}
            />
          </div>
        ))}
      </div>
      <Button className="mt-6" loading={mutation.isPending} onClick={() => mutation.mutate(prefs)}>
        Save Preferences
      </Button>
    </Card>
  )
}
