import type { ReactNode } from "react"
import { ArrowUpRight, Check, FileText } from "lucide-react"

interface LegalSection {
  id: string
  title: string
  content: ReactNode
}

interface LegalPageProps {
  eyebrow: string
  title: string
  description: string
  updatedAt: string
  sections: LegalSection[]
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="legal-list">{children}</ul>
}

export function LegalListItem({ children }: { children: ReactNode }) {
  return (
    <li>
      <Check size={15} aria-hidden="true" />
      <span>{children}</span>
    </li>
  )
}

export function LegalContactLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: ReactNode
}) {
  const external = href.startsWith("http")

  return (
    <a
      className="legal-contact-link"
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span>
        <small>{label}</small>
        {children}
      </span>
      <ArrowUpRight size={18} aria-hidden="true" />
    </a>
  )
}

export default function LegalPage({
  eyebrow,
  title,
  description,
  updatedAt,
  sections,
}: LegalPageProps) {
  return (
    <main className="legal-page">
      <header className="legal-hero">
        <div className="legal-eyebrow">
          <FileText size={15} aria-hidden="true" />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
        <span>Last updated {updatedAt}</span>
      </header>

      <div className="legal-shell">
        <aside className="legal-sidebar" aria-label={`${title} sections`}>
          <strong>On this page</strong>
          <nav>
            {sections.map((section, index) => (
              <a key={section.id} href={`#${section.id}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <article className="legal-content">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id}>
              <div className="legal-section-heading">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h2>{section.title}</h2>
              </div>
              <div className="legal-section-body">{section.content}</div>
            </section>
          ))}
        </article>
      </div>
    </main>
  )
}
