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

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-base-content/60 max-w-2xl mx-auto">
            Choose the plan that fits your needs.
          </p>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Supported Models</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {models.map(model => (
              <div key={model.id} className="flex items-center gap-3 px-5 py-3">
                <img src={model.icon} alt={model.name} className="w-10 h-10 object-contain" />
                <div>
                  <div className="font-semibold text-sm">{model.name}</div>
                  <div className="text-xs text-base-content/60">{model.provider}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex rounded-lg p-1 bg-base-200">
            <button
              className={`btn btn-sm ${billingPeriod === "monthly" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setBillingPeriod("monthly")}
            >
              Monthly
            </button>
            <button
              className={`btn btn-sm ${billingPeriod === "yearly" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setBillingPeriod("yearly")}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {products
            .filter(p => p.interval === (billingPeriod === "monthly" ? "month" : "year"))
            .sort((a, b) => a.sort - b.sort)
            .map(product => {
              const isRecommend = product.recommend

              return (
                <div
                  key={product.id}
                  className={`relative rounded-2xl p-6 ${
                    isRecommend
                      ? "bg-base-100 shadow-xl ring-2 ring-primary"
                      : "bg-base-100 border border-base-200"
                  }`}
                >
                  {isRecommend && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="badge badge-primary badge-sm">Most Popular</span>
                    </div>
                  )}
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold mb-2">{product.product_name}</h2>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">
                        {formatPrice(product.unit_amount || 0, product.currency)}
                      </span>
                      <span className="text-base-content/60">/mo</span>
                    </div>
                    {product.interval === "year" && (
                      <p className="text-xs text-primary font-medium mt-1">
                        {formatPrice(product.unit_amount || 0, product.currency)}/year
                      </p>
                    )}
                    <p className="text-sm text-base-content/60 mt-2">
                      {product.credits} Credits/month
                    </p>
                    <p className="text-xs text-primary font-medium mt-1">
                      ~{product.images} images/month
                    </p>
                  </div>

                  <button
                    className="btn btn-block mb-6 btn-primary"
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

                  <ul className="space-y-3">
                    {product.features.map(feature => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="size-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Have questions?</h2>
          <p className="text-base-content/60 mb-6">
            Check out our{" "}
            <a href="/faq" className="link link-primary">
              FAQ
            </a>{" "}
            or{" "}
            <a href="/contact" className="link link-primary">
              contact us
            </a>{" "}
            for custom enterprise pricing.
          </p>
        </div>
      </div>
    </div>
  )
}
