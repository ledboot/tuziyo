import LegalPage, { LegalContactLink, LegalList, LegalListItem } from "~/components/LegalPage"
import { createSeoMeta } from "~/lib/seo"
import "../styles/legal.css"

export function meta() {
  return createSeoMeta({
    title: "Contact & Support | tuziyo",
    description:
      "Contact tuziyo for product feedback, technical issues, privacy requests, and questions about the AI image and video creation workflow.",
    path: "/contact",
    keywords: "contact tuziyo, tuziyo support, tuziyo privacy contact",
  })
}

const sections = [
  {
    id: "product",
    title: "Product questions and feedback",
    content: (
      <>
        <p>
          For workflow questions, model feedback, launch discussions, and general product contact,
          reach the independent developer behind tuziyo on X.
        </p>
        <LegalContactLink href="https://x.com/ledboot_" label="General product contact">
          @ledboot_
        </LegalContactLink>
      </>
    ),
  },
  {
    id: "technical",
    title: "Technical issues",
    content: (
      <>
        <p>
          Reproducible bugs and public technical issues can be reported in the GitHub repository.
          Include the affected page, browser, expected result, and the steps that reproduce the
          issue.
        </p>
        <LegalList>
          <LegalListItem>
            Do not post account tokens, payment details, or private media.
          </LegalListItem>
          <LegalListItem>Remove personal data from screenshots and logs.</LegalListItem>
          <LegalListItem>
            For billing or account-specific matters, use a private contact channel.
          </LegalListItem>
        </LegalList>
        <LegalContactLink
          href="https://github.com/ledboot/tuziyo/issues"
          label="Public bug reports"
        >
          GitHub Issues
        </LegalContactLink>
      </>
    ),
  },
  {
    id: "privacy",
    title: "Privacy requests",
    content: (
      <>
        <p>
          Use the privacy address for data access, correction, deletion, or other questions about
          how personal information is handled. Include enough information to identify the request,
          but do not send passwords, authentication tokens, or full payment-card details.
        </p>
        <LegalContactLink href="mailto:privacy@tuziyo.com" label="Private email">
          privacy@tuziyo.com
        </LegalContactLink>
      </>
    ),
  },
  {
    id: "resources",
    title: "Policies and self-service",
    content: (
      <div className="legal-resource-grid">
        <LegalContactLink href="/privacy" label="Data handling">
          Privacy Policy
        </LegalContactLink>
        <LegalContactLink href="/terms" label="Service rules">
          Terms of Service
        </LegalContactLink>
        <LegalContactLink href="/pricing" label="Plans and credits">
          Pricing
        </LegalContactLink>
      </div>
    ),
  },
]

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="Contact and support"
      title="How can we help?"
      description="Choose the channel that matches your question, and keep private account or payment details out of public reports."
      updatedAt="August 6, 2026"
      sections={sections}
    />
  )
}
