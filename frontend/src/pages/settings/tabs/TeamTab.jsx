import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Mail, Trash2 } from 'lucide-react'
import { getTeam, inviteMember, removeMember, updateMember } from '../../../api/settingsApi'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import Select from '../../../components/ui/Select'
import Table from '../../../components/ui/Table'
import UsageBar from '../../../components/shared/UsageBar'
import { useAuthStore } from '../../../store/authStore'

function payload(response) {
  return response?.data ?? response ?? {}
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export default function TeamTab() {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [invite, setInvite] = useState({ email: '', role: 'manager' })

  const { data, isLoading } = useQuery({ queryKey: ['settings-team'], queryFn: getTeam })
  const team = payload(data)
  const members = team.members ?? team.data ?? []
  const invitations = team.invitations ?? []
  const usage = team.usageGuard ?? team.usage ?? { used: members.length, limit: 1 }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['settings-team'] })

  const inviteMutation = useMutation({
    mutationFn: inviteMember,
    onSuccess: () => {
      toast.success('Invitation sent')
      setInviteOpen(false)
      setInvite({ email: '', role: 'manager' })
      invalidate()
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateMember(id, data),
    onSuccess: invalidate,
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  const removeMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      toast.success('Member removed')
      invalidate()
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? error.message),
  })

  const columns = [
    {
      key: 'avatar',
      label: 'Avatar',
      render: (member) =>
        member.avatar_url ? (
          <img src={member.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold">
            {initials(member.full_name ?? member.name)}
          </div>
        ),
    },
    {
      key: 'name',
      label: 'Name & Email',
      render: (member) => (
        <div>
          <p className="font-medium text-slate-100">
            {member.full_name ?? member.name} {member.id === currentUser?.id ? <Badge>You</Badge> : null}
          </p>
          <p className="text-sm text-slate-500">{member.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (member) =>
        member.id === currentUser?.id ? (
          <Badge>{member.role}</Badge>
        ) : (
          <select
            value={member.role}
            onChange={(event) => updateMutation.mutate({ id: member.id, data: { role: event.target.value } })}
            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
          >
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>
        ),
    },
    { key: 'last_login', label: 'Last Login', render: (member) => member.last_login_at ?? '-' },
    { key: 'status', label: 'Status', render: (member) => <Badge variant={member.status === 'active' ? 'success' : 'neutral'}>{member.status ?? 'active'}</Badge> },
    {
      key: 'remove',
      label: 'Remove',
      render: (member) =>
        member.id === currentUser?.id ? null : (
          <Button variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => removeMutation.mutate(member.id)}>
            Remove
          </Button>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <Card
        title="Team Members"
        actions={<Button icon={<Mail className="h-4 w-4" />} onClick={() => setInviteOpen(true)}>Invite Team Member</Button>}
      >
        <UsageBar label="Team members" used={usage.used ?? members.length} limit={usage.limit ?? 1} />
        <div className="mt-6">
          <Table columns={columns} data={members} loading={isLoading} />
        </div>
      </Card>

      <Card title="Pending Invitations">
        <Table
          data={invitations}
          columns={[
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Role', render: (row) => <Badge>{row.role}</Badge> },
            { key: 'sent', label: 'Sent', render: (row) => row.sent_at ?? '-' },
            { key: 'expires', label: 'Expires', render: (row) => row.expires_at ?? '-' },
            { key: 'resend', label: 'Resend', render: () => <Button size="sm" variant="outline">Resend</Button> },
            { key: 'cancel', label: 'Cancel', render: () => <Button size="sm" variant="ghost">Cancel</Button> },
          ]}
          emptyMessage="No pending invitations"
        />
      </Card>

      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Team Member" size="sm">
        <div className="space-y-5">
          <Input label="Email" name="invite_email" type="email" value={invite.email} onChange={(e) => setInvite((current) => ({ ...current, email: e.target.value }))} />
          <Select
            label="Role"
            name="invite_role"
            value={invite.role}
            onChange={(e) => setInvite((current) => ({ ...current, role: e.target.value }))}
            options={[{ value: 'manager', label: 'Manager' }, { value: 'staff', label: 'Staff' }]}
          />
          <p className="text-sm text-slate-400">
            Managers can manage bookings and reports. Staff can view assigned operational areas.
          </p>
          <Button className="w-full" loading={inviteMutation.isPending} onClick={() => inviteMutation.mutate(invite)}>
            Send Invitation
          </Button>
        </div>
      </Modal>
    </div>
  )
}
