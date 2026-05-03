import { useAuthStore } from '../../store/authStore'

export default function ImpersonationBanner() {
  const { isImpersonating, tenant, stopImpersonation } = useAuthStore()

  if (!isImpersonating) {
    return null
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 bg-red-600 px-6 py-3 text-sm font-medium text-white shadow-lg">
      <p className="min-w-0 truncate">
        ⚠️ Impersonating {tenant?.business_name ?? 'tenant'} — You are viewing as the tenant owner
      </p>

      <button
        type="button"
        onClick={stopImpersonation}
        className="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Exit Impersonation
      </button>
    </div>
  )
}
