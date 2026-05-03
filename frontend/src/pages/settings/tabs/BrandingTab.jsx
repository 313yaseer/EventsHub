import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Lock, Upload } from 'lucide-react'
import { updateBranding, uploadLogo } from '../../../api/settingsApi'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import LoadingSpinner from '../../../components/shared/LoadingSpinner'
import { hexToRgb } from '../../../hooks/useBranding'
import { useAuthStore } from '../../../store/authStore'

const presets = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#ef4444', '#f97316', '#06b6d4', '#84cc16', '#000000', '#64748b',
]

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function BrandingTab() {
  const navigate = useNavigate()
  const tenant = useAuthStore((state) => state.tenant)
  const updateTenant = useAuthStore((state) => state.updateTenant)
  const [logo, setLogo] = useState(tenant?.logo_url ?? '')
  const [color, setColor] = useState(tenant?.primary_color ?? '#6366f1')
  const isFree = String(tenant?.plan ?? 'free').toLowerCase() === 'free'

  function previewColor(nextColor) {
    setColor(nextColor)
    const rgb = hexToRgb(nextColor)
    document.documentElement.style.setProperty('--primary', nextColor)
    document.documentElement.style.setProperty('--primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`)
  }

  const logoMutation = useMutation({
    mutationFn: uploadLogo,
    onSuccess: (response) => {
      const logoUrl = response?.logo_url ?? response?.url ?? logo
      setLogo(logoUrl)
      updateTenant({ logo_url: logoUrl })
      toast.success('Logo uploaded')
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  const colorMutation = useMutation({
    mutationFn: updateBranding,
    onSuccess: (response) => {
      const updated = response?.tenant ?? response?.data?.tenant ?? { primary_color: color }
      updateTenant(updated)
      toast.success('Brand color saved')
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  async function handleLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be 2MB or less')
      return
    }
    const image = await fileToBase64(file)
    setLogo(image)
    logoMutation.mutate({ image, type: 'tenant_logo' })
  }

  return (
    <div className="relative space-y-6">
      {isFree ? (
        <div className="absolute inset-0 z-10 flex items-start justify-center rounded-xl bg-slate-950/55 p-8 backdrop-blur-sm">
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
            <Lock className="mx-auto h-8 w-8 text-amber-400" />
            <p className="mt-3 font-semibold text-slate-100">🔒 Custom branding requires Pro plan</p>
            <Button className="mt-4" onClick={() => navigate('/settings/billing')}>
              Upgrade Now →
            </Button>
          </div>
        </div>
      ) : null}

      <Card title="Business Logo">
        <label className="flex h-32 w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-900 text-center transition hover:border-[var(--primary)]">
          <input type="file" accept="image/png,image/jpeg" hidden onChange={handleLogo} />
          {logoMutation.isPending ? (
            <LoadingSpinner />
          ) : logo ? (
            <img src={logo} alt="Business logo" className="max-h-24 max-w-[200px] object-contain" />
          ) : (
            <span className="flex flex-col items-center text-sm text-slate-400">
              <Upload className="mb-2 h-6 w-6" />
              Upload your logo
            </span>
          )}
        </label>
      </Card>

      <Card title="Brand Color" subtitle="Choose your primary brand color">
        <div className="grid grid-cols-6 gap-3 md:grid-cols-12">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => previewColor(preset)}
              className="h-10 rounded-lg border border-slate-700 ring-offset-2 ring-offset-slate-800"
              style={{ backgroundColor: preset, outline: color === preset ? '2px solid white' : undefined }}
              aria-label={preset}
            />
          ))}
        </div>
        <div className="mt-5 flex items-end gap-3">
          <div className="h-10 w-10 rounded-lg border border-slate-700" style={{ backgroundColor: color }} />
          <Input label="Custom hex" name="primary_color" value={color} onChange={(e) => previewColor(e.target.value)} className="flex-1" />
          <Button loading={colorMutation.isPending} onClick={() => colorMutation.mutate({ primary_color: color })}>
            Save Color
          </Button>
        </div>
      </Card>

      <Card title="Live Preview">
        <div className="flex overflow-hidden rounded-xl border border-slate-700">
          <div className="w-40 bg-slate-900 p-4">
            {logo ? <img src={logo} alt="" className="mb-4 max-h-10 object-contain" /> : <div className="mb-4 h-10 w-10 rounded-full" style={{ backgroundColor: color }} />}
            <div className="space-y-2">
              <div className="h-8 rounded" style={{ backgroundColor: `${color}33` }} />
              <div className="h-8 rounded bg-slate-800" />
              <div className="h-8 rounded bg-slate-800" />
            </div>
          </div>
          <div className="flex-1 bg-slate-800 p-5">
            <div className="h-4 w-32 rounded" style={{ backgroundColor: color }} />
            <div className="mt-4 h-20 rounded bg-slate-900" />
          </div>
        </div>
      </Card>
    </div>
  )
}
