import { useState, useEffect } from "react"
import { Check, Loader2 } from "lucide-react"
import { useUserStore } from "~/stores/userStore"
import { api } from "~/lib/api"

interface Product {
  id: string
  product_id: string
  product_name: string
  product_description: string
  unit_amount: number
  currency: string
  recurring?: {
    interval: string
  } | null
  interval: string | null
  features: string[]
  credits: number
  images: number
  sort: number
  recommend: boolean
}

interface Model {
  id: string
  name: string
  provider: string
  icon: string
  supportsImage?: boolean
}

const COMPARISON_CATEGORIES = [
  {
    title: "Credits & Performance",
    features: [
      { name: "Monthly Credits", starter: "500 Credits", pro: "2,000 Credits", enterprise: "5,000 Credits" },
      { name: "Estimated Images", starter: "~1,000 / month", pro: "~4,000 / month", enterprise: "~10,000 / month" },
      { name: "Queue Priority", starter: "Standard Priority", pro: "High Priority", enterprise: "Max Priority (Dedicated GPU)" },
      { name: "Parallel Generations", starter: "2 concurrent", pro: "5 concurrent", enterprise: "Unlimited" },
    ]
  },
  {
    title: "Model & Customization",
    features: [
      { name: "Standard Models Access", starter: true, pro: true, enterprise: true },
      { name: "Premium Models (WAN 2.6)", starter: false, pro: true, enterprise: true },
      { name: "Early Access / Beta Models", starter: false, pro: "Priority Access", enterprise: "Full Access" },
      { name: "Reference Images per Prompt", starter: "Up to 3 images", pro: "Up to 16 images", enterprise: "Unlimited + Custom Data" },
      { name: "Custom Fine-Tuned Models", starter: false, pro: false, enterprise: true },
    ]
  },
  {
    title: "Integration & Support",
    features: [
      { name: "Developer API Access", starter: false, pro: "Standard API", enterprise: "Full Custom API" },
      { name: "API Rate Limits", starter: "—", pro: "60 requests / min", enterprise: "Custom High-Volume" },
      { name: "Customer Support", starter: "Email Support", pro: "24h Priority Email", enterprise: "Dedicated Slack & TAM" },
      { name: "Commercial Licensing", starter: true, pro: true, enterprise: "Enterprise SLA & Indemnity" },
    ]
  }
]

const FAQ_ITEMS = [
  {
    q: "What are credits?",
    a: "Credits are the currency used for AI generation activities on Imagine.Art. They are deducted based on the tool, model, output type (image/video), and the number of generations."
  },
  {
    q: "How are credits rolled over?",
    a: "Credits reset at the start of each billing cycle (monthly, quarterly, yearly) and do not carry over. If credits run out mid-cycle, you can upgrade your plan or purchase additional credits."
  },
  {
    q: "Can I use imagineArt for free?",
    a: "Yes, you can register and use our platform for free with limited daily credits. Upgrading to a paid plan unlocks premium models, higher priorities, and more credits."
  },
  {
    q: "Do I have to buy a plan to unlock video generation?",
    a: "Video generation is available on our Professional and Enterprise plans. Starter plan and free accounts are limited to standard image generations."
  },
  {
    q: "What is the difference between buying credits and subscriptions?",
    a: "Subscriptions provide recurring credits monthly or yearly at a highly discounted rate with priority queue access, while one-time credit packages can be purchased as add-ons whenever you run out."
  },
  {
    q: "How to cancel",
    a: "You can cancel your subscription at any time via the Customer Portal in your Account settings. Your paid features will remain active until the end of your current billing period."
  },
  {
    q: "Refund policy?",
    a: "Due to the high GPU computing cost of AI generations, we generally do not offer refunds once credits have been used. If you face technical issues, please contact our support team."
  },
  {
    q: "How to Downgrade",
    a: "You can downgrade your subscription via the Customer Portal. The changes will take effect at the start of your next billing cycle."
  },
  {
    q: "What if my generations fail?",
    a: "Credits for failed generations are refunded instantly, and you will see the notification in your usage analytics."
  },
  {
    q: "Commercial Use Policy",
    a: "All images generated under Starter, Professional, and Enterprise subscription plans come with full commercial rights. You own the assets you create."
  }
]

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [models, setModels] = useState<Model[]>([])
  const { user, token } = useUserStore()

  useEffect(() => {
    api.stripe
      .products()
      .then(data => {
        if (data.products) {
          setProducts(data.products)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    api.models
      .list()
      .then(data => {
        if (data.models) {
          setModels(data.models)
        }
      })
      .catch(console.error)
  }, [])

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent("openLoginModal"))
      return
    }

    if (!token) {
      return
    }

    setLoadingPlan(priceId)
    try {
      const data = await api.stripe.checkout(priceId)
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Checkout error:", error)
    } finally {
      setLoadingPlan(null)
    }
  }

  const formatPrice = (amount: number | null, currency: string) => {
    if (!amount) return "$0"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const renderValue = (val: string | boolean) => {
    if (typeof val === "boolean") {
      return val ? (
        <Check className="size-5 text-primary mx-auto" />
      ) : (
        <span className="text-base-content/20">—</span>
      )
    }
    return val
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Simple, Transparent Pricing</h1>
          <p className="text-lg text-base-content/60 max-w-2xl mx-auto">
            Choose the plan that fits your needs.
          </p>
        </div>

        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-center tracking-tight">Supported Models</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {models.map(model => (
              <div 
                key={model.id} 
                className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-base-200/30 backdrop-blur-md"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-base-200/40 p-2">
                  <img src={model.icon} alt={model.name} className="w-full h-full object-contain invert" />
                </div>
                <div>
                  <div className="font-bold text-sm tracking-tight">{model.name}</div>
                  <div className="text-xs text-base-content/50 font-medium">{model.provider}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex rounded-xl p-1.5 bg-base-200 border border-base-200/30 backdrop-blur-md">
            <button
              className={`btn btn-sm rounded-lg px-6 ${billingPeriod === "monthly" ? "btn-primary shadow-sm" : "btn-ghost"}`}
              onClick={() => setBillingPeriod("monthly")}
            >
              Monthly
            </button>
            <button
              className={`btn btn-sm rounded-lg px-6 ${billingPeriod === "yearly" ? "btn-primary shadow-sm" : "btn-ghost"}`}
              onClick={() => setBillingPeriod("yearly")}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {products
            .filter(p => p.interval === (billingPeriod === "monthly" ? "month" : "year"))
            .sort((a, b) => a.sort - b.sort)
            .map(product => {
              const isRecommend = product.recommend

              return (
                <div
                  key={product.id}
                  className={`relative rounded-3xl p-8 flex flex-col justify-between backdrop-blur-md transition-all duration-300 hover:translate-y-[-4px] ${
                    isRecommend
                      ? "bg-base-200/40 shadow-xl ring-2 ring-primary border border-primary/20"
                      : "bg-base-200/20 border border-base-200/50 shadow-sm"
                  }`}
                >
                  {isRecommend && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="badge badge-primary badge-sm font-semibold tracking-wider uppercase text-[10px] py-2 px-3">Most Popular</span>
                    </div>
                  )}
                  <div>
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-3 tracking-tight">{product.product_name}</h3>
                      <div className="flex items-baseline justify-center gap-1.5 mb-2">
                        <span className="text-5xl font-extrabold tracking-tight">
                          {formatPrice(product.unit_amount || 0, product.currency)}
                        </span>
                        <span className="text-base-content/50 font-medium">/mo</span>
                      </div>
                      {product.interval === "year" && (
                        <p className="text-xs text-primary font-semibold mt-1">
                          {formatPrice(product.unit_amount || 0, product.currency)} billed yearly
                        </p>
                      )}
                    </div>

                    <div className="border-t border-b border-base-200/50 py-4 mb-6 space-y-2 text-center">
                      <p className="text-md font-bold text-base-content">
                        {product.credits.toLocaleString()} Credits/month
                      </p>
                      <p className="text-xs text-primary font-medium">
                        ~{product.images.toLocaleString()} images/month
                      </p>
                    </div>

                    <ul className="space-y-3.5 mb-8">
                      {product.features.map(feature => (
                        <li key={feature} className="flex items-start gap-3 text-sm text-base-content/85">
                          <Check className="size-4.5 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    className="btn btn-block py-3 font-semibold rounded-xl transition-all duration-200 btn-primary text-white hover:shadow-lg"
                    onClick={() => handleSubscribe(product.id)}
                    disabled={loadingPlan === product.id}
                  >
                    {loadingPlan === product.id ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      "Subscribe"
                    )}
                  </button>
                </div>
              )
            })}
        </div>

        {/* Plan Comparison Table Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 tracking-tight">Compare Plans & Features</h2>
            <p className="text-base-content/60 max-w-xl mx-auto text-sm">
              Find the perfect plan tailored to your generation volume and business needs.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-base-200/50 bg-base-200/10 backdrop-blur-md shadow-xl">
            <table className="table w-full border-collapse min-w-[768px]">
              <thead>
                <tr className="border-b border-base-200/50 bg-base-200/30">
                  <th className="py-6 px-8 w-[34%]"></th>
                  <th className="py-6 px-8 text-center text-sm font-bold w-[22%] text-base-content/95">
                    <span className="text-base-content font-bold text-xl">Starter</span>
                  </th>
                  <th className="py-6 px-8 text-center text-sm font-bold w-[22%] text-base-content/95">
                    <span className="text-base-content font-bold text-xl">Professional</span>
                  </th>
                  <th className="py-6 px-8 text-center text-sm font-bold w-[22%] text-base-content/95">
                    <span className="text-base-content font-bold text-xl">Enterprise</span>
                  </th>
                </tr>
              </thead>
              {COMPARISON_CATEGORIES.map((cat, idx) => (
                <tbody key={idx} className="border-t border-base-200/30">
                  <tr className="bg-base-200/20">
                    <td colSpan={4} className="py-4 px-8 text-left text-xs font-extrabold text-primary uppercase tracking-widest bg-base-200/20">
                      {cat.title}
                    </td>
                  </tr>
                  {cat.features.map((feat, fIdx) => (
                    <tr key={fIdx} className="border-b border-base-200/10 hover:bg-base-200/20 transition-colors duration-150">
                      <td className="py-4.5 px-8 text-left text-sm font-medium text-base-content/85">
                        {feat.name}
                      </td>
                      <td className="py-4.5 px-8 text-center text-sm text-base-content/65">
                        {renderValue(feat.starter)}
                      </td>
                      <td className="py-4.5 px-8 text-center text-sm text-base-content/65">
                        {renderValue(feat.pro)}
                      </td>
                      <td className="py-4.5 px-8 text-center text-sm text-base-content/65">
                        {renderValue(feat.enterprise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        </div>

        <div className="mt-24 max-w-4xl mx-auto border-t border-base-200/50 pt-16">
          <h2 className="text-3xl font-bold mb-10 text-center tracking-tight">Frequently asked questions</h2>
          <div className="space-y-1">
            {FAQ_ITEMS.map((faq, idx) => (
              <div key={idx} className="collapse collapse-plus border-b border-base-200/30 rounded-none bg-transparent">
                <input type="checkbox" name={`faq-accordion-${idx}`} className="peer" />
                <div className="collapse-title text-base font-semibold pr-12 py-5 peer-checked:text-primary transition-colors duration-200">
                  {faq.q}
                </div>
                <div className="collapse-content text-base-content/75 pb-5 leading-relaxed text-sm">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-16">
          <p className="text-base-content/50 text-sm">
            Still have questions?{" "}
            <a href="/contact" className="link link-primary font-semibold">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
