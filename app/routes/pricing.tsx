import { useState, useEffect, useRef } from "react"
import {
  Check,
  X,
  Loader2,
  HelpCircle,
  Plus,
  Minus,
} from "lucide-react"
import { useUserStore } from "~/stores/userStore"
import { api } from "~/lib/api"
import { useI18n } from "~/lib/i18n"
import { toast } from "sonner"
import { createSeoMeta } from "~/lib/seo"
import {
  consumePricingIntent,
  getCreditBalanceBucket,
  trackEvent,
  trackPurchaseOnce,
} from "~/lib/analytics"

interface Product {
  product_id: string
  product_name: string
  product_description: string
  features: string[]
  credits: number
  images: number
  sort: number
  recommend: boolean
  prices: {
    monthly: {
      id: string
      unit_amount: number
      currency: string
    } | null
    yearly: {
      id: string
      unit_amount: number
      currency: string
    } | null
  }
}

interface Model {
  id: string
  name: string
  provider: string
  icon: string
  supportsImage?: boolean
}

const FAQ_ITEMS = [
  {
    q: "What are credits?",
    a: "Credits are the currency used for AI generation activities on tuziyo. They are deducted based on the tool, model, output type (image/video), and the complexity of generations.",
  },
  {
    q: "How are credits rolled over?",
    a: "Subscription credits reset at the start of each billing cycle and unused subscription credits do not carry over. One-time purchased credits remain available until used.",
  },
  {
    q: "How do annual plan credits work?",
    a: "Annual plans are billed once per year, but subscription credits are issued monthly on your subscription date. Each monthly grant replaces unused subscription credits from the previous grant period; purchased credits remain available.",
  },
  {
    q: "Can I use tuziyo for free?",
    a: "Yes, you can register and use our platform for free with limited daily credits. Upgrading to a paid plan unlocks premium models, higher priorities, and more credits.",
  },
  {
    q: "What is the difference between buying credits and subscriptions?",
    a: "Subscriptions provide recurring credits that reset each billing cycle with priority queue access. One-time credit packages are add-ons that stay in your account and are used after subscription credits.",
  },
  {
    q: "What happens if a subscription payment fails?",
    a: "We provide a 7-day grace period after a failed renewal payment. If payment is still unresolved after 7 days, subscription credits are cleared and the account is downgraded to Free; purchased credits remain available.",
  },
  {
    q: "How to cancel my subscription?",
    a: "You can cancel your subscription at any time via the Customer Portal in your Account settings. Your paid features will remain active until the end of your current billing period.",
  },
  {
    q: "Refund policy?",
    a: "Due to the high GPU computing cost of AI generations, we generally do not offer refunds once credits have been used. If you face technical issues, please contact our support team.",
  },
  {
    q: "How to Downgrade?",
    a: "You can downgrade your subscription via the Customer Portal. The changes will take effect at the start of your next billing cycle.",
  },
  {
    q: "What if my generations fail?",
    a: "Credits for failed generations are refunded instantly, and you will see the notification in your usage analytics.",
  },
  {
    q: "Commercial Use Policy",
    a: "All images generated under Starter, Professional, and Creator subscription plans come with full commercial rights. You own the assets you create.",
  },
]

export function meta() {
  const title = "AI Image Generation Pricing & Credits | tuziyo"
  const description =
    "Compare tuziyo plans, generation credits, supported AI models, and commercial-use benefits for image and video creation."

  return createSeoMeta({
    title,
    description,
    path: "/pricing",
    keywords: "tuziyo pricing, ai image generation pricing, ai credits, image generator plans",
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: {
          "@type": "Answer",
          text: a,
        },
      })),
    },
  })
}

// 3种等级的模型支持配置

function FAQItem({ q, a }: { q: string; a: string }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="border-b border-[#161a23] py-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group py-2 cursor-pointer"
      >
        <span
          className={`text-[15px] font-extrabold transition-colors duration-300 ${
            isOpen ? "text-primary" : "text-gray-200 group-hover:text-white"
          }`}
        >
          {q}
        </span>
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ml-4 transition-all duration-300 ${
            isOpen
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-[#181d2a] text-gray-400 border border-[#272e42] group-hover:bg-[#202738] group-hover:text-white"
          }`}
        >
          <div className="relative w-3.5 h-3.5 flex items-center justify-center">
            <div
              className={`absolute transition-all duration-300 transform ${
                isOpen ? "rotate-90 opacity-0 scale-75" : "rotate-0 opacity-100 scale-100"
              }`}
            >
              <Plus size={14} />
            </div>
            <div
              className={`absolute transition-all duration-300 transform ${
                isOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-75"
              }`}
            >
              <Minus size={14} />
            </div>
          </div>
        </div>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden text-xs md:text-sm text-gray-400 leading-relaxed font-medium">
          {a}
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [planModelsConfig, setPlanModelsConfig] = useState<Record<
    string,
    Array<{ name: string; supported: boolean; label?: string }>
  > | null>(null)
  const { user, token, isLoading: isUserLoading, isFetching: isUserFetching } = useUserStore()
  const { lang } = useI18n()
  const pricingViewTrackedRef = useRef(false)
  const checkoutReturnHandledRef = useRef(false)

  useEffect(() => {
    if (pricingViewTrackedRef.current || isUserLoading || isUserFetching) return
    pricingViewTrackedRef.current = true
    trackEvent("view_pricing", {
      source: consumePricingIntent(),
      user_type: user?.userType ?? "anonymous",
      credit_balance_bucket: user ? getCreditBalanceBucket(user.credits) : "anonymous",
    })
  }, [isUserFetching, isUserLoading, user])

  useEffect(() => {
    if (checkoutReturnHandledRef.current) return
    checkoutReturnHandledRef.current = true

    const searchParams = new URLSearchParams(window.location.search)
    const sessionId = searchParams.get("session_id")
    const isSuccessReturn = searchParams.get("success") === "true"
    const isCanceledReturn = searchParams.get("canceled") === "true"

    if (isCanceledReturn) {
      trackEvent("checkout_cancelled", { checkout_type: "subscription" })
      window.history.replaceState({}, "", "/pricing")
      return
    }

    if (!isSuccessReturn || !sessionId) return

    void api.stripe
      .checkoutStatus(sessionId)
      .then(({ checkout }) => {
        if (!checkout.completed) {
          trackEvent("checkout_incomplete", {
            payment_status: checkout.payment_status,
            checkout_status: checkout.status ?? "unknown",
          })
          return
        }

        trackPurchaseOnce(checkout.transaction_id, {
          value: checkout.value,
          currency: checkout.currency,
          plan_id: checkout.plan_id,
          plan_name: checkout.plan_name,
          billing_period: checkout.billing_period,
          items: [
            {
              item_id: checkout.plan_id ?? "unknown",
              item_name: checkout.plan_name,
              item_category: "subscription",
              price: checkout.value,
              quantity: 1,
            },
          ],
        })
        toast.success(lang === "zh" ? "订阅成功" : "Subscription activated")
      })
      .catch(error => {
        console.error("Checkout verification error:", error)
      })
      .finally(() => {
        window.history.replaceState({}, "", "/pricing")
      })
  }, [lang])

  useEffect(() => {
    api.stripe
      .products()
      .then(data => {
        if (data.products) {
          setProducts(data.products)
        }
      })
      .catch(console.error)

    api.models
      .list()
      .then(data => {
        if (data.plan_models_config) {
          setPlanModelsConfig(data.plan_models_config)
        }
      })
      .catch(console.error)
  }, [])

  const handleSubscribe = async (
    product: Product,
    price: NonNullable<Product["prices"]["monthly"]>,
    planKey: "starter" | "professional" | "creator"
  ) => {
    trackEvent("select_plan", {
      plan_id: price.id,
      plan_name: planKey,
      billing_period: billingPeriod,
      value: price.unit_amount / 100,
      currency: price.currency.toUpperCase(),
      credit_amount: product.credits,
    })

    if (!user) {
      trackEvent("login_prompt", { source: "pricing_checkout" })
      window.dispatchEvent(new CustomEvent("openLoginModal"))
      return
    }

    if (!token) {
      return
    }

    // Check if the user is already subscribed to any tier
    const userPlan = (user.userType ?? "free").toLowerCase()
    if (userPlan === "starter" || userPlan === "professional" || userPlan === "creator") {
      const msg = lang === "zh"
        ? "您已拥有激活的订阅。请前往个人中心管理或变更您的方案。"
        : "You already have an active subscription. Please manage or change your plan in your profile."
      toast.info(msg)
      return
    }

    setLoadingPlan(price.id)
    try {
      const data = await api.stripe.checkout(price.id)
      if (data.url) {
        trackEvent("begin_checkout", {
          currency: price.currency.toUpperCase(),
          value: price.unit_amount / 100,
          plan_id: price.id,
          plan_name: planKey,
          billing_period: billingPeriod,
          items: [
            {
              item_id: price.id,
              item_name: planKey,
              item_category: "subscription",
              price: price.unit_amount / 100,
              quantity: 1,
            },
          ],
        })
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

  // 根据产品名/排序等对计划进行归类：Starter / Professional / Creator
  const getPlanKey = (name: string): "starter" | "professional" | "creator" => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes("starter") || lowerName.includes("basic")) {
      return "starter"
    } else if (lowerName.includes("creator") || lowerName.includes("enterprise")) {
      return "creator"
    } else {
      return "professional"
    }
  }

  // 渲染每个计划的附加特征列表
  const getAdditionalFeatures = (planKey: "starter" | "professional" | "creator") => {
    if (planKey === "starter") {
      return [
        "1 concurrent generation task",
        "Up to ~500 standard Image Generations/month",
        "General Commercial Terms",
        "Image Generation Visibility: Public",
        "Priority Support",
      ]
    } else if (planKey === "professional") {
      return [
        "2 concurrent generation tasks",
        "Up to ~1,500 standard Image Generations/month",
        "General Commercial Terms",
        "Image Generation Visibility: Private",
        "24h Priority Support",
      ]
    } else {
      return [
        "4 concurrent generation tasks",
        "Up to ~5,000 standard Image Generations/month",
        "All styles and models",
        "General Commercial Terms",
        "Image Generation Visibility: Private",
        "Dedicated Slack & TAM Support",
      ]
    }
  }

  // 不同的方案的主题样式
  const getPlanStyles = (planKey: "starter" | "professional" | "creator") => {
    switch (planKey) {
      case "starter":
        return {
          cardBorder: "border-[#1e293b] hover:border-indigo-500/40 bg-[#0f172a]/20",
          badgeBg: "bg-slate-800 text-slate-300",
          btnClass: "bg-slate-800 hover:bg-slate-700 text-white border-none",
          creditsText: "text-indigo-400",
          glowShadow: "hover:shadow-[0_0_30px_rgba(99,102,241,0.05)]",
          accentColor: "indigo-500",
          name: "Starter",
          desc: "For newcomers taking their first steps",
          badgeText: null,
        }
      case "professional":
        return {
          cardBorder:
            "border-primary bg-primary/5 shadow-2xl shadow-primary/5 ring-1 ring-primary/20",
          badgeBg: "bg-primary text-accent-content",
          btnClass:
            "bg-primary hover:opacity-90 text-primary-content border-none shadow-lg shadow-primary/20",
          creditsText: "text-primary",
          glowShadow: "hover:shadow-3xl hover:shadow-primary/15",
          accentColor: "primary",
          name: "Professional",
          desc: "For rising creators to level up their game",
          badgeText: "MOST POPULAR",
        }
      case "creator":
        return {
          cardBorder: "border-accent bg-accent/5 shadow-2xl shadow-accent/5 ring-1 ring-accent/20",
          badgeBg: "bg-accent text-accent-content",
          btnClass:
            "bg-accent hover:opacity-90 text-accent-content border-none shadow-lg shadow-accent/20",
          creditsText: "text-accent",
          glowShadow: "hover:shadow-3xl hover:shadow-accent/15",
          accentColor: "accent",
          name: "Creator",
          desc: "A full production engine for powerhouses",
          badgeText: "SPECIAL OFFER",
        }
    }
  }

  return (
    <div className="min-h-screen bg-[#060709] text-gray-100 selection:bg-indigo-500/30">
      <div className="container mx-auto py-40 max-w-4xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px]">
        {/* Header Section */}
        <div className="text-center mb-16 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
            Simple, Premium Pricing
          </h1>
          <p className="text-md md:text-lg text-gray-400 max-w-none mx-auto font-medium whitespace-nowrap">
            Unlock professional-grade AI generation models with our flexible plans.
          </p>
        </div>

        {/* Billing Period Toggle */}
        <div className="text-center mb-16 relative z-10">
          <div className="inline-flex items-center rounded-full p-1.5 bg-[#0f1115] border border-[#1b1e24] shadow-inner">
            <button
              className={`flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-black transition-all duration-300 cursor-pointer ${
                billingPeriod === "monthly"
                  ? "bg-white text-[#060709] shadow-lg shadow-black/35 scale-100 font-extrabold"
                  : "bg-transparent text-gray-400 hover:text-white hover:scale-102"
              }`}
              onClick={() => {
                setBillingPeriod("monthly")
                trackEvent("select_billing_period", { billing_period: "monthly" })
              }}
            >
              Monthly
            </button>

            <button
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black transition-all duration-300 cursor-pointer ${
                billingPeriod === "yearly"
                  ? "bg-white text-[#060709] shadow-lg shadow-black/35 scale-100 font-extrabold"
                  : "bg-transparent text-gray-400 hover:text-white hover:scale-102"
              }`}
              onClick={() => {
                setBillingPeriod("yearly")
                trackEvent("select_billing_period", { billing_period: "yearly" })
              }}
            >
              <span>Yearly</span>
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-lg shadow-[0_0_12px_rgba(124,58,237,0.5)] bg-[#7c3aed] text-white ${
                  billingPeriod === "yearly" ? "animate-pulse" : ""
                }`}
              >
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-28 relative z-10">
          {products.map(product => {
            const planKey = getPlanKey(product.product_name)
            const styles = getPlanStyles(planKey)
            const additionalFeatures = getAdditionalFeatures(planKey)
            const modelsList = (planModelsConfig && planModelsConfig[planKey]) || []
            const currentUserPlan = (user?.userType ?? "free").toLowerCase()
            const isCurrentPlan = currentUserPlan === planKey

            const activePrice =
              billingPeriod === "monthly" ? product.prices.monthly : product.prices.yearly
            if (!activePrice) return null // 降级处理：若该周期价格没有配置，不显示该卡片

            return (
              <div
                key={product.product_id}
                className={`relative rounded-3xl p-8 flex flex-col justify-between border backdrop-blur-xl transition-all duration-500 hover:translate-y-[-8px] ${styles.cardBorder} ${styles.glowShadow}`}
              >
                {/* Glowing Top Badge */}
                {styles.badgeText && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className={`badge ${styles.badgeBg} badge-sm font-extrabold tracking-widest uppercase text-[9px] py-2 px-4 rounded-full border-none shadow-[0_0_12px_rgba(0,0,0,0.5)]`}
                    >
                      {styles.badgeText}
                    </span>
                  </div>
                )}

                <div>
                  {/* Header info */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-black tracking-tight text-white">
                        {styles.name}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-400 font-medium mb-6">{styles.desc}</p>

                    {/* Pricing block */}
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="text-5xl font-black text-white tracking-tight">
                        {formatPrice(
                          billingPeriod === "yearly"
                            ? (activePrice.unit_amount || 0) / 12
                            : activePrice.unit_amount || 0,
                          activePrice.currency
                        )}
                      </span>
                      <span className="text-gray-400 text-sm font-semibold">/month</span>
                    </div>
                    {billingPeriod === "yearly" ? (
                      <p className="text-[10px] text-gray-400 font-semibold tracking-wide mt-1">
                        Billed annually
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-400 font-semibold tracking-wide mt-1">
                        Billed monthly
                      </p>
                    )}
                  </div>

                  {/* Subscription Action Button */}
                  {isCurrentPlan ? (
                    <button
                      className="btn btn-block py-3.5 rounded-2xl font-extrabold text-sm border-none bg-slate-800 text-slate-500 cursor-not-allowed opacity-60"
                      disabled={true}
                    >
                      {lang === "zh" ? "当前方案" : "Current Plan"}
                    </button>
                  ) : (
                    <button
                      className={`btn btn-block py-3.5 rounded-2xl font-extrabold text-sm transition-all duration-300 transform active:scale-95 ${styles.btnClass}`}
                      onClick={() => handleSubscribe(product, activePrice, planKey)}
                      disabled={loadingPlan === activePrice.id}
                    >
                      {loadingPlan === activePrice.id ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="size-4.5 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        "Get Started"
                      )}
                    </button>
                  )}

                  {/* Credits Counter */}
                  <div className="mt-8 mb-8 flex items-center gap-2">
                    <span className="text-sm font-bold tracking-tight text-white">
                      {product.credits.toLocaleString()} credits per month
                    </span>
                  </div>

                  {/* Additional Features Section */}
                  <div className="mb-8 border-t border-[#161a23] pt-6">
                    <h4 className="text-xs font-black text-gray-300 uppercase tracking-wider mb-4">
                      Additional Features
                    </h4>
                    <ul className="space-y-3">
                      {additionalFeatures.map((feat, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-gray-300 font-medium"
                        >
                          <Check className="size-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Access to 10+ models Section */}
                  <div className="border-t border-[#161a23] pt-6">
                    <h4 className="text-xs font-black text-gray-300 uppercase tracking-wider mb-4">
                      Access to 10+ models
                    </h4>
                    <ul className="space-y-3">
                      {modelsList.map((modelItem, idx) => (
                        <li
                          key={idx}
                          className={`flex items-start gap-2.5 text-xs font-medium ${
                            modelItem.supported ? "text-gray-300" : "text-gray-500 opacity-40"
                          }`}
                        >
                          {modelItem.supported ? (
                            <Check className="size-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <X className="size-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          )}
                          <span>{modelItem.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Premium FAQ Section */}
        <div className="mt-28 w-full max-w-4xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px] mx-auto border-t border-[#161a23] pt-20">
          <div className="text-center mb-16 relative">
            <HelpCircle className="size-8 mx-auto text-primary mb-4 animate-bounce" />
            <h2 className="text-3xl font-black text-white tracking-tight mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-400 text-sm max-w-none mx-auto font-medium whitespace-nowrap">
              Everything you need to know about tuziyo billing, credits, and memberships.
            </p>
          </div>

          <div className="w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1200px] mx-auto">
            {FAQ_ITEMS.map((faq, idx) => (
              <FAQItem key={idx} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
