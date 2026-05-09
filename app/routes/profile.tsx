import { useState, useEffect } from "react"
import { Link } from "react-router"
import { Coins, Loader2, Calendar, CreditCard, LogOut, Heart, Play, Image as ImageIcon } from "lucide-react"
import { useUserStore } from "~/stores/userStore"
import { api } from "~/lib/api"

interface Transaction {
  id: string
  amount: number
  type: string
  description: string
  model: string | null
  credits_per_image: number | null
  created_at: number
}

interface CreditInfo {
  balance: number
  total_purchased: number
  total_used: number
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatCredits(amount: number): string {
  return amount > 0 ? `+${amount}` : `${amount}`
}

interface FavoriteItem {
  id: string
  type: "image" | "video"
  url: string
  title: string
  createdAt: number
}

const MOCK_FAVORITES: FavoriteItem[] = [
  { id: "1", type: "image", url: "https://picsum.photos/seed/tuziyo1/800/600", title: "Neon Dreams", createdAt: 1715241600 },
  { id: "2", type: "video", url: "https://picsum.photos/seed/tuziyo2/800/1000", title: "Future City", createdAt: 1715231600 },
  { id: "3", type: "image", url: "https://picsum.photos/seed/tuziyo3/800/800", title: "Abstract Flow", createdAt: 1715221600 },
  { id: "4", type: "image", url: "https://picsum.photos/seed/tuziyo4/1000/800", title: "Cyber Samurai", createdAt: 1715211600 },
  { id: "5", type: "video", url: "https://picsum.photos/seed/tuziyo5/800/600", title: "Digital Rain", createdAt: 1715201600 },
  { id: "6", type: "image", url: "https://picsum.photos/seed/tuziyo6/800/1200", title: "Ethereal Landscape", createdAt: 1715191600 },
]

export default function ProfilePage() {
  const { user, logout } = useUserStore()
  const [credits, setCredits] = useState<CreditInfo | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  // Example state for sidebar selection
  const [activeTab, setActiveTab] = useState("credits")

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    api.credits
      .get()
      .then(data => {
        if (data.credits) {
          setCredits(data.credits)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!user) return

    setLoadingTransactions(true)
    api.transactions
      .list(50)
      .then(data => {
        if (data.transactions) {
          setTransactions(data.transactions)
        }
      })
      .catch(console.error)
      .finally(() => setLoadingTransactions(false))
  }, [user])

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-base-200 via-base-100 to-base-100 flex items-center justify-center">
        <div className="text-center bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-3xl p-12">
          <h1 className="text-2xl font-bold mb-2 text-white">Authentication Required</h1>
          <p className="text-base-content/60">
            Please log in to view your profile and manage credits.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-base-200 via-base-100 to-base-100 pt-10 pb-20 px-6">
      <div className="w-full">
        <div className="flex flex-col md:flex-row gap-8 md:gap-16">
          {/* Left Sidebar */}
          <div className="w-full md:w-64 shrink-0 flex flex-col">
            {/* User Info Header */}
            <div className="mb-10 px-2">
              <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
              <p className="text-base-content/60 text-sm font-medium">{user.email}</p>
            </div>

            {/* Navigation Menu */}
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => setActiveTab("favorites")}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors border ${activeTab === "favorites" ? "bg-white/5 text-white border-white/5" : "text-base-content/70 hover:bg-white/[0.02] hover:text-white border-transparent cursor-pointer"}`}
              >
                <Heart className="size-5" />
                <span className="font-medium text-sm">Favorites</span>
              </button>

              <button
                onClick={() => setActiveTab("credits")}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors border ${activeTab === "credits" ? "bg-white/5 text-white border-white/5" : "text-base-content/70 hover:bg-white/[0.02] hover:text-white border-transparent cursor-pointer"}`}
              >
                <Coins className="size-5" />
                <span className="font-medium text-sm">Credits & Billing</span>
              </button>

              <button
                type="button"
                onClick={() => logout()}
                className="flex items-center gap-4 px-4 py-3 rounded-xl text-base-content/70 hover:bg-white/[0.02] hover:text-white transition-colors border border-transparent mt-4 cursor-pointer"
              >
                <LogOut className="size-5" />
                <span className="font-medium text-sm">Log out</span>
              </button>
            </nav>
          </div>

          {/* Right Content */}
          <div className="flex-1 min-w-0 space-y-10">
            {activeTab === "credits" && (
              <>
                {/* Content Header */}
                <div className="border-b border-white/5 pb-6">
                  <h1 className="text-3xl font-bold tracking-tight text-white">
                    Credits & Billing
                  </h1>
                  <p className="text-base-content/60 mt-2">
                    Manage your credits balance and view your transaction history.
                  </p>
                </div>

                {/* Credits Card */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                  {/* Ambient Glow */}
                  <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                  <div className="relative z-10 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/20 rounded-xl border border-primary/20 shadow-inner">
                          <Coins className="size-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Credits Balance</h3>
                      </div>
                      <Link
                        to="/pricing"
                        className="btn btn-primary btn-sm text-white rounded-xl px-5 border-none shadow-[0_0_15px_rgba(var(--color-primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--color-primary),0.5)] transition-shadow"
                      >
                        <CreditCard className="size-4 mr-1" />
                        Buy Credits
                      </Link>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      {loading ? (
                        <div className="flex justify-center items-center py-4">
                          <Loader2 className="size-8 animate-spin text-primary" />
                        </div>
                      ) : credits ? (
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-5xl sm:text-6xl font-bold text-white tracking-tight leading-none drop-shadow-md">
                                {credits.balance.toLocaleString()}
                              </span>
                              <span className="text-lg font-medium text-base-content/50 uppercase tracking-wider">
                                Credits
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-6 pb-1">
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-1.5">
                                Total Purchased
                              </span>
                              <span className="text-lg font-bold text-green-400">
                                +{credits.total_purchased.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-px bg-white/10 my-1"></div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-1.5">
                                Total Used
                              </span>
                              <span className="text-lg font-bold text-white/80">
                                {credits.total_used.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-base-content/60 text-center py-4">
                          No credit information available.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                      <Calendar className="size-5 text-white/80" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Transaction History</h3>
                  </div>

                  {loadingTransactions ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="size-8 animate-spin text-primary" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center size-16 rounded-full bg-white/5 mb-4 border border-white/10">
                        <Calendar className="size-6 text-white/40" />
                      </div>
                      <p className="text-lg text-white/80 font-medium">No transactions yet</p>
                      <p className="text-base-content/50 mt-1">
                        Your activity will appear here once you start using credits.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-6 sm:mx-0">
                      <div className="inline-block min-w-full align-middle px-6 sm:px-0">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 text-xs font-bold text-base-content/50 uppercase tracking-wider">
                              <th className="pb-4 pl-2 font-semibold">Type</th>
                              <th className="pb-4 font-semibold">Description</th>
                              <th className="pb-4 text-right font-semibold">Amount</th>
                              <th className="pb-4 text-right pr-2 font-semibold hidden sm:table-cell">
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {transactions.map(tx => {
                              const isPositive = tx.amount > 0
                              const isZero = tx.amount === 0

                              let amountClasses = "text-white/60"

                              if (isPositive) {
                                amountClasses = "text-green-400"
                              } else if (!isZero) {
                                amountClasses = "text-white/90"
                              }

                              return (
                                <tr
                                  key={tx.id}
                                  className="hover:bg-white/[0.03] transition-colors group"
                                >
                                  <td className="py-4 pl-2 whitespace-nowrap">
                                    <span className="font-medium capitalize text-white/90">
                                      {tx.type}
                                    </span>
                                  </td>
                                  <td className="py-4">
                                    <div className="font-medium text-white/80">
                                      {tx.description}
                                    </div>
                                    {tx.model && (
                                      <div className="text-xs text-base-content/50 mt-1.5 flex items-center gap-1.5">
                                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                                          {tx.model}
                                        </span>
                                      </div>
                                    )}
                                    <div className="text-xs text-base-content/40 mt-1 sm:hidden">
                                      {formatTimestamp(tx.created_at)}
                                    </div>
                                  </td>
                                  <td className="py-4 text-right whitespace-nowrap">
                                    <span
                                      className={`font-mono font-bold text-lg ${amountClasses}`}
                                    >
                                      {formatCredits(tx.amount)}
                                    </span>
                                  </td>
                                  <td className="py-4 text-right pr-2 whitespace-nowrap hidden sm:table-cell">
                                    <span className="text-sm font-medium text-base-content/50 group-hover:text-white/70 transition-colors">
                                      {formatTimestamp(tx.created_at)}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "favorites" && (
              <>
                {/* Content Header */}
                <div className="border-b border-white/5 pb-6">
                  <h1 className="text-3xl font-bold tracking-tight text-white">Favorites</h1>
                  <p className="text-base-content/60 mt-2">
                    View the images and videos you've liked from details pages.
                  </p>
                </div>

                {/* Favorites Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {MOCK_FAVORITES.map(item => (
                    <div
                      key={item.id}
                      className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-white/5 border border-white/10 transition-all hover:border-primary/50 hover:shadow-[0_0_20px_rgba(var(--color-primary),0.2)]"
                    >
                      <img
                        src={item.url}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                        <div className="flex items-center justify-between">
                          <h4 className="text-white font-medium text-sm truncate pr-2">
                            {item.title}
                          </h4>
                          <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-lg">
                            {item.type === "video" ? (
                              <Play className="size-3 text-white" fill="currentColor" />
                            ) : (
                              <ImageIcon className="size-3 text-white" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Type Indicator (Always visible but subtle) */}
                      <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">
                        {item.type}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
