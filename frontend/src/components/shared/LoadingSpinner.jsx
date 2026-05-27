const sizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export default function LoadingSpinner({ size = 'md', className = '' }) {
  return (
    <div className={['flex items-center justify-center', className].filter(Boolean).join(' ')}>
      <div
        className={[
          'animate-spin rounded-full border-2 border-(--primary) border-t-transparent',
          sizes[size] ?? sizes.md,
        ].join(' ')}
      />
    </div>
  )
}
