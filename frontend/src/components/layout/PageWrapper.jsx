export default function PageWrapper({ title = 'Page', children }) {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div>{children}</div>
    </section>
  )
}
