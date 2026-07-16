import {
  ArrowUpRight,
  Check,
  Cloud,
  Cookie,
  CreditCard,
  Database,
  FileText,
  Fingerprint,
  Globe2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react"
import { createSeoMeta } from "~/lib/seo"
import "./privacy.css"

export function meta() {
  return createSeoMeta({
    title: "Privacy Policy | tuziyo",
    description:
      "Learn how tuziyo collects, uses, stores, and protects account data, creative content, payment information, and usage data.",
    path: "/privacy",
    keywords: "tuziyo privacy policy, data privacy, AI image generator privacy",
  })
}

const sections = [
  { id: "scope", label: "Scope" },
  { id: "information", label: "Information we collect" },
  { id: "use", label: "How we use information" },
  { id: "processing", label: "Creative content & AI" },
  { id: "sharing", label: "How we share information" },
  { id: "storage", label: "Cookies & local storage" },
  { id: "retention", label: "Retention & security" },
  { id: "rights", label: "Your rights" },
  { id: "international", label: "International transfers" },
  { id: "children", label: "Children's privacy" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact us" },
]

function PolicySection({
  id,
  number,
  title,
  icon: Icon,
  children,
}: {
  id: string
  number: string
  title: string
  icon: typeof ShieldCheck
  children: React.ReactNode
}) {
  return (
    <section id={id} className="privacy-section scroll-mt-28">
      <div className="privacy-section-heading">
        <span className="privacy-section-icon" aria-hidden="true">
          <Icon size={18} strokeWidth={1.8} />
        </span>
        <div>
          <span className="privacy-section-number">{number}</span>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="privacy-section-content">{children}</div>
    </section>
  )
}

function BulletList({ children }: { children: React.ReactNode }) {
  return <ul className="privacy-list">{children}</ul>
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li>
      <Check size={15} aria-hidden="true" />
      <span>{children}</span>
    </li>
  )
}

export default function PrivacyPage() {
  return (
    <div className="privacy-page">
      <div className="privacy-glow privacy-glow-one" aria-hidden="true" />
      <div className="privacy-glow privacy-glow-two" aria-hidden="true" />

      <header className="privacy-hero">
        <div className="privacy-eyebrow">
          <ShieldCheck size={15} aria-hidden="true" />
          Your privacy, explained clearly
        </div>
        <h1>Privacy Policy</h1>
        <p className="privacy-lead">
          This policy explains what information tuziyo collects, why we use it, who may process it,
          and the choices you have when using our creative tools and services.
        </p>
        <div className="privacy-meta">
          <span>Effective July 15, 2026</span>
          <span aria-hidden="true">•</span>
          <span>Last updated July 15, 2026</span>
        </div>

        <div className="privacy-principles" aria-label="Our privacy principles">
          <div>
            <LockKeyhole size={19} aria-hidden="true" />
            <span>
              <strong>Purpose limited</strong>
              We use data to operate, secure, and improve tuziyo.
            </span>
          </div>
          <div>
            <Fingerprint size={19} aria-hidden="true" />
            <span>
              <strong>Your choices</strong>
              You may request access, correction, or deletion.
            </span>
          </div>
          <div>
            <ShieldCheck size={19} aria-hidden="true" />
            <span>
              <strong>No data sales</strong>
              We do not sell your personal information.
            </span>
          </div>
        </div>
      </header>

      <div className="privacy-layout">
        <aside className="privacy-nav" aria-label="Privacy policy contents">
          <p>On this page</p>
          <ol>
            {sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {section.label}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <article className="privacy-document">
          <div className="privacy-summary">
            <Sparkles size={20} aria-hidden="true" />
            <div>
              <strong>The short version</strong>
              <p>
                tuziyo processes prompts, generation settings, and files you choose to upload to
                provide AI creative features. We share this data only with the infrastructure and AI
                providers needed to produce and store your requested output.
              </p>
            </div>
          </div>

          <PolicySection id="scope" number="01" title="Scope" icon={FileText}>
            <p>
              This Privacy Policy applies to tuziyo.com, our web application, related APIs, and the
              services we provide through them (collectively, the “Service”). It does not cover
              third-party websites or services that have their own privacy notices.
            </p>
            <p>
              By using the Service, you acknowledge the practices described in this policy. If you
              use tuziyo for an organization, that organization may separately control information
              associated with its account.
            </p>
          </PolicySection>

          <PolicySection
            id="information"
            number="02"
            title="Information we collect"
            icon={Database}
          >
            <h3>Information you provide</h3>
            <BulletList>
              <Bullet>
                <strong>Account information:</strong> name, email address, profile image, sign-in
                provider identifier, and account preferences received when you sign in with Google.
              </Bullet>
              <Bullet>
                <strong>Creative content:</strong> prompts, negative prompts, reference files,
                generation settings, session titles, generated outputs, and related metadata.
              </Bullet>
              <Bullet>
                <strong>Transactions:</strong> subscription plan, credit balance and history,
                billing status, and identifiers associated with Stripe transactions. We do not
                receive or store your full payment-card number.
              </Bullet>
              <Bullet>
                <strong>Communications:</strong> information you include when contacting us for
                support, feedback, or privacy requests.
              </Bullet>
            </BulletList>

            <h3>Information collected automatically</h3>
            <p>
              When you use the Service, we and our service providers may collect device and browser
              type, approximate location derived from IP address, referral and page URLs, feature
              interactions, model selections, generation status, diagnostic data, and timestamps. We
              use this information for security, troubleshooting, analytics, and product
              improvement.
            </p>
          </PolicySection>

          <PolicySection id="use" number="03" title="How we use information" icon={UserRoundCheck}>
            <p>We use information described above to:</p>
            <BulletList>
              <Bullet>Provide, maintain, personalize, and improve the Service.</Bullet>
              <Bullet>Authenticate users, maintain sessions, and protect accounts.</Bullet>
              <Bullet>Process AI generation requests and deliver generated outputs.</Bullet>
              <Bullet>Administer subscriptions, payments, credits, and transaction records.</Bullet>
              <Bullet>
                Measure performance, diagnose errors, prevent fraud, abuse, and misuse.
              </Bullet>
              <Bullet>
                Respond to support requests and send important service communications.
              </Bullet>
              <Bullet>Comply with legal obligations and enforce our agreements.</Bullet>
            </BulletList>
          </PolicySection>

          <PolicySection
            id="processing"
            number="04"
            title="Creative content and AI processing"
            icon={Cloud}
          >
            <div className="privacy-callout-grid">
              <div>
                <span className="privacy-callout-label submitted">Submitted for processing</span>
                <h3>Inputs you choose</h3>
                <p>
                  Prompts, reference files, model selections, and generation settings are
                  transmitted to our systems and the relevant AI provider to fulfill your request.
                </p>
              </div>
              <div>
                <span className="privacy-callout-label stored">Stored in your account</span>
                <h3>Sessions and outputs</h3>
                <p>
                  Session details and generated outputs may be stored in our cloud infrastructure so
                  they remain available in your creative history and can be delivered securely.
                </p>
              </div>
            </div>
            <p>
              Please do not submit content you do not have the right to use, or sensitive personal
              information that is not necessary for your request. Provider handling of submitted
              content may also be governed by the provider terms applicable to our integration.
            </p>
          </PolicySection>

          <PolicySection id="sharing" number="05" title="How we share information" icon={Globe2}>
            <p>We may disclose information only as needed to the following recipients:</p>
            <BulletList>
              <Bullet>
                <strong>Infrastructure and AI providers</strong> that host data, deliver the
                Service, or process generation requests on our behalf.
              </Bullet>
              <Bullet>
                <strong>Google</strong> for sign-in and, where enabled, site analytics and
                measurement.
              </Bullet>
              <Bullet>
                <strong>Stripe</strong> to process subscriptions and payments.
              </Bullet>
              <Bullet>
                <strong>Professional advisers and authorities</strong> when reasonably necessary to
                comply with law, protect rights and safety, or investigate misuse.
              </Bullet>
              <Bullet>
                <strong>A successor organization</strong> in connection with a merger, financing,
                acquisition, reorganization, or sale of assets, subject to appropriate safeguards.
              </Bullet>
            </BulletList>
            <p>We do not sell your personal information.</p>
          </PolicySection>

          <PolicySection id="storage" number="06" title="Cookies and local storage" icon={Cookie}>
            <p>
              tuziyo uses browser storage and similar technologies to keep you signed in, remember
              language and interface preferences, preserve temporary workflow state, prevent
              duplicate analytics events, and understand how the Service is used. Google Tag Manager
              and enabled analytics services may set or access their own identifiers.
            </p>
            <p>
              You can control cookies and site data through your browser settings. Blocking or
              clearing essential storage may sign you out or cause parts of the Service to stop
              working as expected.
            </p>
          </PolicySection>

          <PolicySection
            id="retention"
            number="07"
            title="Data retention and security"
            icon={LockKeyhole}
          >
            <p>
              We retain information for as long as reasonably necessary to provide the Service,
              maintain your account and creative history, meet legal and accounting obligations,
              resolve disputes, and protect the Service. Retention periods vary by data type and
              purpose. Information may remain temporarily in backups or logs after deletion.
            </p>
            <p>
              We use reasonable technical and organizational safeguards intended to protect
              information from unauthorized access, loss, misuse, or alteration. No online system is
              completely secure, so we cannot guarantee absolute security.
            </p>
          </PolicySection>

          <PolicySection id="rights" number="08" title="Your rights and choices" icon={Fingerprint}>
            <p>
              Depending on where you live, you may have the right to request access to, correction
              of, deletion of, or a copy of your personal information; object to or restrict certain
              processing; withdraw consent; or appeal a decision about your request.
            </p>
            <p>
              You may update certain profile information through the Service and control browser
              storage through your browser. To make a privacy request, contact us using the details
              below. We may need to verify your identity before completing a request, and some
              information may be retained where legally required.
            </p>
          </PolicySection>

          <PolicySection
            id="international"
            number="09"
            title="International data transfers"
            icon={Globe2}
          >
            <p>
              tuziyo and its service providers may process information in countries other than the
              one where you live. Data protection laws in those countries may differ. Where
              required, we use appropriate safeguards for international transfers of personal
              information.
            </p>
          </PolicySection>

          <PolicySection id="children" number="10" title="Children's privacy" icon={ShieldCheck}>
            <p>
              The Service is not directed to children under 13, and we do not knowingly collect
              personal information from children under 13. If you believe a child has provided us
              with personal information, please contact us so we can take appropriate action. Higher
              minimum ages may apply in some jurisdictions.
            </p>
          </PolicySection>

          <PolicySection id="changes" number="11" title="Changes to this policy" icon={FileText}>
            <p>
              We may update this Privacy Policy as our Service or legal obligations change. We will
              post the revised policy on this page and update the date above. If changes are
              material, we may provide an additional notice through the Service or by email when
              appropriate.
            </p>
          </PolicySection>

          <PolicySection id="contact" number="12" title="Contact us" icon={Mail}>
            <p>
              Questions about this policy or requests concerning your personal information can be
              sent to:
            </p>
            <a className="privacy-contact" href="mailto:privacy@tuziyo.com">
              <span>
                <Mail size={18} aria-hidden="true" />
                <span>
                  <small>Privacy inquiries</small>
                  privacy@tuziyo.com
                </span>
              </span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </PolicySection>

          <div className="privacy-payment-note">
            <CreditCard size={18} aria-hidden="true" />
            <p>
              Payment details are processed by Stripe. tuziyo stores transaction and subscription
              records needed to manage your plan, but not your full payment-card number.
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}
