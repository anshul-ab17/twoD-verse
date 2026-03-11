import LogoText from "./LogoText"

const PRODUCT_LINKS = ["Features", "How it Works", "Themes", "Characters"]
const COMPANY_LINKS = ["About", "Blog", "Careers", "Contact"]
const LEGAL_LINKS = ["Privacy Policy", "Terms of Service", "Cookie Policy"]
const SOCIAL_LINKS = ["GitHub", "Twitter", "Discord"]

function productHref(label: string) {
  if (label === "Features") return "#features"
  if (label === "How it Works") return "#how-it-works"
  return "#"
}

export default function LandingFooter() {
  return (
    <footer
      style={{
        background: "var(--footer-bg)",
        borderTop: "1px solid var(--divider)",
        padding: "4rem 0 2rem",
      }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: "1200px" }}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <LogoText className="text-lg" textClassName="text-[var(--text)]" />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Virtual office for distributed teams. Move, meet, and collaborate in real-time 2D spaces.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Product
            </p>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l}>
                  <a href={productHref(l)} className="text-sm transition-colors" style={{ color: "var(--text-muted)" }}>
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Company
            </p>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm transition-colors" style={{ color: "var(--text-muted)" }}>
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Legal
            </p>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm transition-colors" style={{ color: "var(--text-muted)" }}>
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row"
          style={{ borderColor: "var(--divider)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} TwoDverse. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {SOCIAL_LINKS.map((s) => (
              <a key={s} href="#" className="text-xs transition-colors" style={{ color: "var(--text-muted)" }}>
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
