import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Camera } from 'lucide-react'
import { changePassword, updateProfile, uploadLogo } from '../../../api/settingsApi'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import { useAuthStore } from '../../../store/authStore'

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function score(password = '') {
  return [
    password.length >= 8,
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length
}

export default function ProfileTab() {
  const inputRef = useRef(null)
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const [profile, setProfile] = useState({
    full_name: user?.full_name ?? '',
    avatar_url: user?.avatar_url ?? '',
  })
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const strength = score(passwords.new_password)

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (response) => {
      const updated = response?.user ?? response?.data?.user ?? profile
      updateUser(updated)
      toast.success('Profile updated')
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  const avatarMutation = useMutation({
    mutationFn: uploadLogo,
    onSuccess: (response) => {
      const avatarUrl = response?.avatar_url ?? response?.url ?? profile.avatar_url
      updateUser({ avatar_url: avatarUrl })
      setProfile((current) => ({ ...current, avatar_url: avatarUrl }))
      toast.success('Avatar updated')
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPasswords({ current_password: '', new_password: '', confirm_password: '' })
      toast.success('Password updated')
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  async function handleAvatar(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const image = await fileToBase64(file)
    setProfile((current) => ({ ...current, avatar_url: image }))
    avatarMutation.mutate({ image, type: 'avatar' })
  }

  function savePassword() {
    if (passwords.new_password !== passwords.confirm_password) {
      toast.error('Passwords do not match')
      return
    }
    passwordMutation.mutate(passwords)
  }

  return (
    <div className="space-y-6">
      <Card title="Personal Information">
        <div className="mb-6 flex items-center gap-5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group relative h-20 w-20 overflow-hidden rounded-full bg-slate-700 text-lg font-semibold text-slate-100"
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
            ) : (
              initials(profile.full_name)
            )}
            <span className="absolute inset-0 hidden items-center justify-center bg-black/50 group-hover:flex">
              <Camera className="h-5 w-5" />
            </span>
          </button>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
          <div>
            <p className="font-medium text-slate-100">Profile avatar</p>
            <p className="text-sm text-slate-400">Click the avatar to upload a new image.</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="Full Name"
            name="full_name"
            value={profile.full_name}
            onChange={(event) => setProfile((current) => ({ ...current, full_name: event.target.value }))}
          />
          <Input
            label="Email"
            name="email"
            value={user?.email ?? ''}
            disabled
            hint="Contact support to change email"
          />
          <div>
            <p className="mb-2 text-sm font-medium text-slate-300">Role</p>
            <Badge>{user?.role ?? 'staff'}</Badge>
          </div>
        </div>

        <Button className="mt-6" loading={profileMutation.isPending} onClick={() => profileMutation.mutate(profile)}>
          Save Changes
        </Button>
      </Card>

      <Card title="Security" subtitle="Change Password">
        <div className="grid gap-5 md:grid-cols-3">
          <Input
            label="Current Password"
            name="current_password"
            type="password"
            value={passwords.current_password}
            onChange={(event) => setPasswords((current) => ({ ...current, current_password: event.target.value }))}
          />
          <div>
            <Input
              label="New Password"
              name="new_password"
              type="password"
              value={passwords.new_password}
              onChange={(event) => setPasswords((current) => ({ ...current, new_password: event.target.value }))}
            />
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                className={[
                  'h-full rounded-full',
                  strength <= 1 ? 'bg-red-500' : strength <= 3 ? 'bg-amber-500' : 'bg-emerald-500',
                ].join(' ')}
                style={{ width: passwords.new_password ? `${Math.max(25, strength * 25)}%` : '0%' }}
              />
            </div>
          </div>
          <Input
            label="Confirm"
            name="confirm_password"
            type="password"
            value={passwords.confirm_password}
            onChange={(event) => setPasswords((current) => ({ ...current, confirm_password: event.target.value }))}
          />
        </div>
        <Button className="mt-6" loading={passwordMutation.isPending} onClick={savePassword}>
          Update Password
        </Button>
      </Card>
    </div>
  )
}
