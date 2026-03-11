type Props = {
  className?: string
  textClassName?: string
}

export default function LogoText({ className = "", textClassName = "" }: Props) {
  return (
    <span className={`font-extrabold tracking-tight select-none ${className}`}>
      <span className={textClassName}>TwoD</span>
      <span className="logo-verse">verse</span>
    </span>
  )
}
