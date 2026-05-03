import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { updateBusiness } from '../../../api/settingsApi'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import { useAuthStore } from '../../../store/authStore'

const states = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
].map((value) => ({ value, label: value }))

export default function BusinessTab() {
  const tenant = useAuthStore((state) => state.tenant)
  const updateTenant = useAuthStore((state) => state.updateTenant)
  const [form, setForm] = useState({
    business_name: tenant?.business_name ?? '',
    contact_email: tenant?.contact_email ?? '',
    phone: tenant?.phone ?? '',
    address: tenant?.address ?? '',
    city: tenant?.city ?? '',
    state: tenant?.state ?? '',
    website: tenant?.website ?? '',
    timezone: tenant?.timezone ?? 'Africa/Lagos',
  })

  const mutation = useMutation({
    mutationFn: updateBusiness,
    onSuccess: (response) => {
      const updated = response?.tenant ?? response?.data?.tenant ?? form
      updateTenant(updated)
      toast.success('Business settings saved')
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <Card title="Business Information">
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="Business Name" name="business_name" value={form.business_name} onChange={(e) => setField('business_name', e.target.value)} />
        <Input label="Contact Email" name="contact_email" type="email" value={form.contact_email} onChange={(e) => setField('contact_email', e.target.value)} />
        <Input label="Phone" name="phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
        <Input label="Website" name="website" value={form.website} onChange={(e) => setField('website', e.target.value)} />
        <Input label="Address" name="address" value={form.address} onChange={(e) => setField('address', e.target.value)} className="md:col-span-2" />
        <Input label="City" name="city" value={form.city} onChange={(e) => setField('city', e.target.value)} />
        <Select label="State" name="state" value={form.state} onChange={(e) => setField('state', e.target.value)} options={states} placeholder="Select state" />
        <Select
          label="Timezone"
          name="timezone"
          value={form.timezone}
          onChange={(e) => setField('timezone', e.target.value)}
          options={[{ value: 'Africa/Lagos', label: 'Africa/Lagos' }]}
          className="md:col-span-2"
        />
      </div>
      <Button className="mt-6" loading={mutation.isPending} onClick={() => mutation.mutate(form)}>
        Save Changes
      </Button>
    </Card>
  )
}
