export default function Select({ children, ...props }) {
  return (
    <select className="w-full rounded-lg border border-slate-300 px-3 py-2" {...props}>
      {children}
    </select>
  )
}
