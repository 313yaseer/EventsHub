export default function Button({ children = 'Button', className = '', ...props }) {
  return (
    <button
      className={`rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
