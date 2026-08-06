import LegalPage, { LegalContactLink, LegalList, LegalListItem } from "~/components/LegalPage"
import { createSeoMeta } from "~/lib/seo"
import "../styles/legal.css"

export function meta() {
  return createSeoMeta({
    title: "Terms of Service | tuziyo",
    description:
      "Read the terms that govern tuziyo accounts, AI generation credits, subscriptions, creative content, acceptable use, and service availability.",
    path: "/terms",
    keywords: "tuziyo terms of service, AI generation terms, tuziyo credits",
  })
}

const sections = [
  {
    id: "service",
    title: "Using the service",
    content: (
      <>
        <p>
          These Terms govern your use of tuziyo, including its image and video generation workflows,
          reusable sessions, Library, Studio, model guides, and related services. By creating an
          account or using the Service, you agree to these Terms and our Privacy Policy.
        </p>
        <p>
          You must be legally able to enter into this agreement in your jurisdiction. If you use
          tuziyo for an organization, you represent that you have authority to accept these Terms
          for that organization.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Accounts and security",
    content: (
      <>
        <p>
          You are responsible for activity performed through your account and for keeping access
          credentials secure. Account information must be accurate and may not impersonate another
          person or organization.
        </p>
        <LegalList>
          <LegalListItem>
            Do not share access in a way that bypasses plan or usage limits.
          </LegalListItem>
          <LegalListItem>Notify us if you believe your account has been compromised.</LegalListItem>
          <LegalListItem>
            Do not use automated access that disrupts or overloads the Service.
          </LegalListItem>
        </LegalList>
      </>
    ),
  },
  {
    id: "credits",
    title: "Credits, subscriptions, and payments",
    content: (
      <>
        <p>
          AI generation uses credits. The number of credits required depends on the selected model,
          output type, settings, and number of outputs. The estimated cost shown before a generation
          is the applicable product price for that request.
        </p>
        <LegalList>
          <LegalListItem>
            Subscription credits are issued according to the billing cycle and do not roll over
            unless the plan explicitly says otherwise.
          </LegalListItem>
          <LegalListItem>
            One-time purchased credits remain available until used, subject to these Terms.
          </LegalListItem>
          <LegalListItem>
            Credits for generation tasks recorded as failed are restored according to the product's
            billing records.
          </LegalListItem>
          <LegalListItem>
            Stripe processes payment details. tuziyo does not store your full payment-card number.
          </LegalListItem>
        </LegalList>
        <p>
          Subscriptions may be cancelled through the Stripe customer portal. Unless required by law,
          consumed generation credits are not refundable because provider compute costs are incurred
          when a request is processed.
        </p>
      </>
    ),
  },
  {
    id: "content",
    title: "Your inputs and outputs",
    content: (
      <>
        <p>
          You retain the rights you have in prompts, reference media, and other inputs you submit.
          Subject to applicable law and provider terms, you may use generated outputs, including
          commercially when your plan permits it.
        </p>
        <p>
          You grant tuziyo the limited rights needed to transmit, store, process, and display your
          inputs and outputs to operate the Service. You are responsible for ensuring that your
          inputs and intended use of outputs do not infringe third-party rights.
        </p>
      </>
    ),
  },
  {
    id: "providers",
    title: "AI providers and generated results",
    content: (
      <>
        <p>
          Generation requests are processed using the model provider selected through tuziyo.
          Prompts, references, settings, and required request metadata may be sent to that provider
          to create the output.
        </p>
        <p>
          AI outputs can be inaccurate, unexpected, or similar to material created for other users.
          You must review an output before publishing it or relying on it for legal, medical,
          financial, safety-critical, or other consequential decisions.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    content: (
      <LegalList>
        <LegalListItem>
          Do not violate applicable law or the rights of another person.
        </LegalListItem>
        <LegalListItem>
          Do not create or distribute non-consensual intimate imagery, sexual content involving
          minors, or material that exploits children.
        </LegalListItem>
        <LegalListItem>
          Do not use the Service for fraud, impersonation, harassment, malware, or attempts to evade
          safeguards and provider restrictions.
        </LegalListItem>
        <LegalListItem>
          Do not reverse engineer, resell access, or interfere with the Service except where law
          expressly permits it.
        </LegalListItem>
      </LegalList>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes",
    content: (
      <>
        <p>
          Models, limits, prices, and features can change as provider capabilities and operating
          costs change. We may suspend a model or request type when necessary for reliability,
          safety, legal compliance, or provider requirements.
        </p>
        <p>
          We aim to keep the Service available but do not guarantee uninterrupted operation or that
          every provider request will succeed. Maintenance, provider outages, network conditions,
          and events outside our control may affect availability.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    title: "Suspension and termination",
    content: (
      <p>
        We may restrict or terminate access when an account materially violates these Terms, creates
        risk for other users or providers, or must be restricted to comply with law. You may stop
        using the Service at any time and can cancel an active subscription through the customer
        portal.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Disclaimers and liability",
    content: (
      <>
        <p>
          The Service is provided on an "as is" and "as available" basis to the extent permitted by
          law. We disclaim implied warranties that cannot be reasonably guaranteed for generative AI
          services, including uninterrupted availability, fitness for a particular purpose, and
          non-infringement of every generated output.
        </p>
        <p>
          To the maximum extent permitted by law, tuziyo is not liable for indirect, incidental,
          special, consequential, or punitive damages, or for lost profits, data, goodwill, or
          business opportunities arising from use of the Service.
        </p>
      </>
    ),
  },
  {
    id: "changes-contact",
    title: "Changes and contact",
    content: (
      <>
        <p>
          We may update these Terms as the Service or applicable requirements change. The revised
          version will be posted here with a new effective date. Continued use after an update takes
          effect means you accept the revised Terms.
        </p>
        <LegalContactLink href="/contact" label="Questions about these terms">
          Contact tuziyo
        </LegalContactLink>
      </>
    ),
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Service agreement"
      title="Terms of Service"
      description="The rules and responsibilities that apply when you create, organize, and generate visual content with tuziyo."
      updatedAt="August 6, 2026"
      sections={sections}
    />
  )
}
