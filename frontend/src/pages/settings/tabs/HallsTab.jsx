import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { createHall, deleteHall, getHalls, toggleHall, updateHall } from '../../../api/hallsApi'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import Textarea from '../../../components/ui/Textarea'
import Toggle from '../../../components/ui/Toggle'
import UsageBar from '../../../components/shared/UsageBar'

const amenities = ['AC', 'WiFi', 'Projector', 'Sound System', 'Catering', 'Parking', 'Stage', 'Dressing Room']

const emptyHall = {
  name: '',
  capacity: '',
  price_per_hour: '',
  amenities: [],
  description: '',
  is_available: true,
}

function payload(response) {
  return response?.data ?? response ?? {}
}

export default function HallsTab() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyHall)

  const { data, isLoading } = useQuery({ queryKey: ['halls'], queryFn: getHalls })
  const dataPayload = payload(data)
  const halls = dataPayload.halls ?? dataPayload.data ?? []
  const usage = dataPayload.usageGuard ?? dataPayload.usage ?? { used: halls.length, limit: 1 }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['halls'] })

  const saveMutation = useMutation({
    mutationFn: (values) => editing ? updateHall(editing.id, values) : createHall(values),
    onSuccess: () => {
      toast.success(editing ? 'Hall updated' : 'Hall created')
      setModalOpen(false)
      setEditing(null)
      setForm(emptyHall)
      invalidate()
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteHall,
    onSuccess: invalidate,
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  const toggleMutation = useMutation({
    mutationFn: toggleHall,
    onSuccess: invalidate,
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  function openEdit(hall) {
    setEditing(hall)
    setForm({
      name: hall.name ?? '',
      capacity: hall.capacity ?? '',
      price_per_hour: hall.price_per_hour ?? '',
      amenities: hall.amenities ?? [],
      description: hall.description ?? '',
      is_available: Boolean(hall.is_available ?? hall.available),
    })
    setModalOpen(true)
  }

  function toggleAmenity(amenity) {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }))
  }

  return (
    <div className="space-y-6">
      <Card title="Halls" actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setForm(emptyHall); setModalOpen(true) }}>Add Hall</Button>}>
        <UsageBar label="Halls" used={usage.used ?? halls.length} limit={usage.limit ?? 1} />
      </Card>

      {isLoading ? null : (
        <div className="grid gap-5 xl:grid-cols-2">
          {halls.map((hall) => (
            <Card key={hall.id} title={hall.name}>
              <div className="space-y-4">
                <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                  <p>Capacity: {hall.capacity ?? 0}</p>
                  <p>Price: ₦{hall.price_per_hour ?? 0}/hr</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(hall.amenities ?? []).map((amenity) => <Badge key={amenity}>{amenity}</Badge>)}
                </div>
                <div className="flex items-center justify-between border-t border-slate-700 pt-4">
                  <Toggle checked={Boolean(hall.is_available ?? hall.available)} onChange={() => toggleMutation.mutate(hall.id)} label="Available" />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => openEdit(hall)}>Edit</Button>
                    <Button size="sm" variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => deleteMutation.mutate(hall.id)}>Delete</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Hall' : 'Add Hall'} size="lg">
        <div className="grid gap-5 md:grid-cols-2">
          <Input label="Hall Name" name="name" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} />
          <Input label="Capacity" name="capacity" type="number" value={form.capacity} onChange={(e) => setForm((current) => ({ ...current, capacity: e.target.value }))} />
          <Input label="Price/Hour (₦)" name="price" type="number" value={form.price_per_hour} onChange={(e) => setForm((current) => ({ ...current, price_per_hour: e.target.value }))} />
          <div className="flex items-end">
            <Toggle checked={form.is_available} onChange={(value) => setForm((current) => ({ ...current, is_available: value }))} label="Is Available" />
          </div>
          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-medium text-slate-300">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={[
                    'rounded-full border px-3 py-1 text-sm',
                    form.amenities.includes(amenity)
                      ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_20%,transparent)] text-slate-100'
                      : 'border-slate-700 text-slate-400',
                  ].join(' ')}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>
          <Textarea label="Description" name="description" value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} className="md:col-span-2" />
          <Button className="md:col-span-2" loading={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
            Save
          </Button>
        </div>
      </Modal>
    </div>
  )
}
