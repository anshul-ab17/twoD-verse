export default function Button({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`px-6 py-3 rounded-xl font-medium transition shadow-md hover:shadow-lg ${className}`}
    >
      {children}
    </button>
  )
}