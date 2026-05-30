import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { QRCodeCanvas } from 'qrcode.react'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { getAttendeePass } from '../../api/attendeesApi'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { useAuthStore } from '../../store/authStore'

function payload(response) {
  return response?.data ?? response ?? {}
}

function formatDate(date) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function formatTime(time) {
  return time ? String(time).slice(0, 5) : '-'
}

function shortId(value) {
  return String(value ?? '').slice(0, 8).toUpperCase()
}

const CARD_TEMPLATES = {
  'classic-luxe': {
    gradient: 'linear-gradient(135deg, #111827 0%, #4b3416 48%, #f59e0b 100%)',
    accent: '#d4af37',
    soft: '#fff7ed',
    text: '#111827',
  },
  'modern-minimal': {
    gradient: 'linear-gradient(135deg, #0f172a 0%, #075985 52%, #38bdf8 100%)',
    accent: '#38bdf8',
    soft: '#f0f9ff',
    text: '#0f172a',
  },
  'royal-gold': {
    gradient: 'linear-gradient(135deg, #3b0764 0%, #7e22ce 48%, #facc15 100%)',
    accent: '#facc15',
    soft: '#faf5ff',
    text: '#2e1065',
  },
  'floral-wedding': {
    gradient: 'linear-gradient(135deg, #9f1239 0%, #f472b6 52%, #ffe4e6 100%)',
    accent: '#f9a8d4',
    soft: '#fff1f2',
    text: '#881337',
  },
  'graduation-bold': {
    gradient: 'linear-gradient(135deg, #111827 0%, #374151 48%, #f59e0b 100%)',
    accent: '#f59e0b',
    soft: '#fffbeb',
    text: '#111827',
  },
  'corporate-clean': {
    gradient: 'linear-gradient(135deg, #134e4a 0%, #0f766e 50%, #99f6e4 100%)',
    accent: '#99f6e4',
    soft: '#f0fdfa',
    text: '#134e4a',
  },
  'birthday-pop': {
    gradient: 'linear-gradient(135deg, #be123c 0%, #ec4899 45%, #22c55e 100%)',
    accent: '#22c55e',
    soft: '#fdf2f8',
    text: '#881337',
  },
  'black-tie': {
    gradient: 'linear-gradient(135deg, #020617 0%, #18181b 52%, #71717a 100%)',
    accent: '#e5e7eb',
    soft: '#fafafa',
    text: '#020617',
  },
  'festival-bright': {
    gradient: 'linear-gradient(135deg, #c2410c 0%, #f97316 45%, #fde047 100%)',
    accent: '#fde047',
    soft: '#fff7ed',
    text: '#7c2d12',
  },
  'soft-elegance': {
    gradient: 'linear-gradient(135deg, #475569 0%, #8b5cf6 52%, #c4b5fd 100%)',
    accent: '#c4b5fd',
    soft: '#f5f3ff',
    text: '#312e81',
  },
}

function formatDetailLabel(value) {
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function normalizePass(pass, attendee, event, tenant) {
  const source = pass ?? {}
  const sourceAttendee = source.attendee ?? attendee ?? {}
  const sourceEvent = source.event ?? event ?? {}

  return {
    tenantLogo: source.tenant?.logo_url ?? tenant?.logo_url,
    tenantName: source.tenant?.business_name ?? tenant?.business_name ?? 'EVENTSHUB',
    primaryColor: source.tenant?.primary_color ?? tenant?.primary_color ?? '#6366f1',
    eventName: source.event_name ?? sourceEvent.event_name ?? sourceEvent.name ?? '-',
    eventDate: source.event_date ?? sourceEvent.event_date ?? sourceEvent.date,
    startTime: source.start_time ?? sourceEvent.start_time,
    endTime: source.end_time ?? sourceEvent.end_time,
    hallName: source.hall_name ?? sourceEvent.hall_name ?? sourceEvent.hall?.name,
    eventType: source.event_type ?? sourceEvent.event_type ?? sourceEvent.type,
    attendeeName:
      source.full_name ?? source.attendee_name ?? sourceAttendee.full_name ?? sourceAttendee.name ?? '-',
    seatNumber: source.seat_number ?? sourceAttendee.seat_number ?? sourceAttendee.seat ?? '-',
    tag: source.tag ?? sourceAttendee.tag ?? 'Guest',
    passTemplate: source.pass_template ?? sourceAttendee.pass_template ?? 'classic-luxe',
    passDetails: source.pass_details ?? sourceAttendee.pass_details ?? {},
    qrToken: source.qr_token ?? sourceAttendee.qr_token ?? source.token ?? sourceAttendee.token ?? '',
    passId: source.pass_id ?? source.id ?? sourceAttendee.id ?? source.qr_token ?? sourceAttendee.qr_token,
  }
}

export default function GatePassCard({ pass, attendee, event, compact = false, showActions = true }) {
  const { attendeeId } = useParams()
  const navigate = useNavigate()
  const tenant = useAuthStore((state) => state.tenant)
  const isStandalone = Boolean(attendeeId)

  const { data, isLoading } = useQuery({
    queryKey: ['attendee-pass', attendeeId],
    queryFn: () => getAttendeePass(attendeeId),
    enabled: isStandalone,
  })

  const passData = useMemo(
    () => normalizePass(payload(data).pass ?? payload(data), attendee, event, tenant),
    [attendee, data, event, tenant],
  )
  const template = CARD_TEMPLATES[passData.passTemplate] ?? CARD_TEMPLATES['classic-luxe']
  const details = Object.entries(passData.passDetails || {})
    .filter(([, value]) => value)
    .slice(0, 2)
  const timeRange = `${formatTime(passData.startTime)}${
    passData.endTime ? ` - ${formatTime(passData.endTime)}` : ''
  }`

  function downloadPdf() {
    window.print()
  }

  if (isStandalone && isLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen bg-slate-900" />
  }

  return (
    <main
      className={
        isStandalone
          ? 'min-h-screen bg-slate-900 px-6 py-10 text-slate-100'
          : 'text-slate-100'
      }
    >
      <style>
        {`
          .gate-pass-shell {
            width: 21.5rem;
            height: 13.5rem;
          }
          @media print {
            ${isStandalone ? '@page { size: 85.6mm 54mm; margin: 0; }' : ''}
            body { background: white !important; }
            .print-hidden { display: none !important; }
            .gate-pass-shell {
              width: 85.6mm !important;
              height: 54mm !important;
              box-shadow: none !important;
              margin: 0 auto !important;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}
      </style>

      <div className={isStandalone ? 'mx-auto max-w-xl' : ''}>
        <article
          className="gate-pass-shell relative mx-auto overflow-hidden rounded-[1.35rem] border border-white/70 text-slate-950 shadow-2xl ring-1 ring-black/10 print:shadow-none"
          style={{ background: template.soft }}
        >
          <div
            className="absolute inset-y-0 left-0 w-[38%]"
            style={{ background: template.gradient || passData.primaryColor }}
          />
          <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full border border-white/40 bg-white/15" />
          <div className="absolute bottom-5 left-7 h-14 w-14 rounded-full border border-white/40 bg-white/10" />
          <div className="absolute right-[-2.5rem] top-[-2.5rem] h-24 w-24 rounded-full bg-white/60" />
          <div className="absolute bottom-[-2rem] right-20 h-16 w-16 rounded-full bg-white/40" />

          <div className="relative grid h-full grid-cols-[38%_1fr]">
            <aside className="flex h-full flex-col justify-between p-4 text-white">
              <div>
                <div className="flex items-center gap-2">
                  {passData.tenantLogo ? (
                    <img
                      src={passData.tenantLogo}
                      alt={passData.tenantName}
                      className="h-7 max-w-16 rounded bg-white/20 object-contain p-1"
                    />
                  ) : null}
                  <span className="text-[0.55rem] font-black uppercase tracking-[0.22em]">
                    {passData.tenantName}
                  </span>
                </div>
                <p className="mt-5 text-[0.62rem] font-black uppercase tracking-[0.3em]">
                  You're Invited
                </p>
                <p className="mt-2 max-w-[6.5rem] text-lg font-black leading-5">
                  {passData.eventName}
                </p>
              </div>

              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.25em] opacity-80">Pass ID</p>
                <p className="mt-1 rounded-full bg-white/20 px-2 py-1 text-[0.62rem] font-black tracking-widest">
                  {shortId(passData.passId)}
                </p>
              </div>
            </aside>

            <section className="flex h-full flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.58rem] font-black uppercase tracking-[0.32em]" style={{ color: template.text }}>
                    Invitation Card
                  </p>
                  <h2 className="mt-1 truncate text-xl font-black leading-6" style={{ color: template.text }}>
                    {passData.attendeeName}
                  </h2>
                  <div
                    className="mt-2 inline-flex rounded-full px-3 py-1 text-[0.58rem] font-black uppercase tracking-widest"
                    style={{ backgroundColor: template.accent, color: template.text }}
                  >
                    {passData.tag}
                  </div>
                </div>

                <div className="rounded-xl bg-white p-1.5 shadow-lg">
                  <QRCodeCanvas value={passData.qrToken || String(passData.passId ?? '')} size={62} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[0.67rem]">
                <div className="rounded-xl bg-white/75 p-2 shadow-sm">
                  <p className="font-black uppercase tracking-wider text-slate-400">Date</p>
                  <p className="mt-0.5 font-black text-slate-900">{formatDate(passData.eventDate)}</p>
                </div>
                <div className="rounded-xl bg-white/75 p-2 shadow-sm">
                  <p className="font-black uppercase tracking-wider text-slate-400">Time</p>
                  <p className="mt-0.5 font-black text-slate-900">{timeRange}</p>
                </div>
                <div className="rounded-xl bg-white/75 p-2 shadow-sm">
                  <p className="font-black uppercase tracking-wider text-slate-400">Seat</p>
                  <p className="mt-0.5 truncate font-black text-slate-900">{passData.seatNumber}</p>
                </div>
                <div className="rounded-xl bg-white/75 p-2 shadow-sm">
                  <p className="font-black uppercase tracking-wider text-slate-400">Venue</p>
                  <p className="mt-0.5 truncate font-black text-slate-900">{passData.hallName ?? '-'}</p>
                </div>
              </div>

              {details.length ? (
                <div className="mt-2 flex gap-1.5 overflow-hidden text-[0.58rem]">
                  {details.map(([key, value]) => (
                    <div key={key} className="min-w-0 rounded-full bg-white/65 px-2 py-1 font-bold text-slate-700">
                      <span className="text-slate-400">{formatDetailLabel(key)}: </span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-auto flex items-center justify-between border-t border-white/70 pt-2">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Scan at entry
                </p>
                <p className="text-[0.58rem] font-black uppercase tracking-[0.18em]" style={{ color: template.text }}>
                  Admit One
                </p>
              </div>
            </section>
          </div>
        </article>

        {showActions ? (
          <div className="print-hidden mt-6 flex flex-wrap justify-center gap-3">
            <Button icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
              {compact ? 'Print' : 'Print This Pass'}
            </Button>
            {isStandalone ? (
              <>
                <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={downloadPdf}>
                  Download PDF
                </Button>
                <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(-1)}>
                  ← Back to Event
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  )
}
