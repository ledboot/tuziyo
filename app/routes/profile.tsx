import { useState, useEffect } from "react";
import { Coins, ArrowUpRight, ArrowDownLeft, Loader2, Calendar } from "lucide-react";
import { useUserStore } from "~/stores/userStore";
import { api } from "~/lib/api";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  model: string | null;
  credits_per_image: number | null;
  created_at: number;
}

interface CreditInfo {
  balance: number;
  total_purchased: number;
  total_used: number;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCredits(amount: number): string {
  return amount >= 0 ? `+${amount}` : `${amount}`;
}

function getTransactionIcon(type: string) {
  switch (type) {
    case "subscription":
    case "purchase":
      return ArrowUpRight;
    case "generation":
    case "refund":
    default:
      return ArrowDownLeft;
  }
}

function getTransactionColor(type: string): string {
  switch (type) {
    case "subscription":
    case "purchase":
      return "text-green-500";
    case "generation":
      return "text-red-500";
    case "refund":
      return "text-yellow-500";
    default:
      return "text-base-content";
  }
}

export default function ProfilePage() {
  const { user } = useUserStore();
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    api.credits.get()
      .then((data) => {
        if (data.credits) {
          setCredits(data.credits);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;

    setLoadingTransactions(true);
    api.transactions.list(50)
      .then((data) => {
        if (data.transactions) {
          setTransactions(data.transactions);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingTransactions(false));
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view your profile</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-base-100 border border-base-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold mb-1">{user.name}</h2>
            <p className="text-base-content/60 text-sm">{user.email}</p>
          </div>

          {loading ? (
            <div className="bg-base-100 border border-base-200 rounded-2xl p-6 flex items-center justify-center">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : credits ? (
            <div className="bg-base-100 border border-base-200 rounded-2xl p-6 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Coins className="size-6 text-primary" />
                <h3 className="text-lg font-semibold">Credits Balance</h3>
              </div>
              <div className="text-4xl font-bold mb-4">
                {credits.balance.toLocaleString()}
                <span className="text-lg font-normal text-base-content/60 ml-2">credits</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-base-content/60">Total Purchased</div>
                  <div className="font-semibold text-green-500">
                    +{credits.total_purchased.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-base-content/60">Total Used</div>
                  <div className="font-semibold text-red-500">
                    -{credits.total_used.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-base-100 border border-base-200 rounded-2xl p-6 md:col-span-2">
              <p className="text-base-content/60">No credit information available</p>
            </div>
          )}
        </div>

        <div className="bg-base-100 border border-base-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="size-5 text-primary" />
            <h3 className="text-lg font-semibold">Transaction History</h3>
          </div>

          {loadingTransactions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center py-12 text-base-content/60">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const Icon = getTransactionIcon(tx.type);
                    const colorClass = getTransactionColor(tx.type);

                    return (
                      <tr key={tx.id}>
                        <td>
                          <div className={`flex items-center gap-2 ${colorClass}`}>
                            <Icon className="size-4" />
                            <span className="capitalize">{tx.type}</span>
                          </div>
                        </td>
                        <td>
                          <div className="font-medium">{tx.description}</div>
                          {tx.model && (
                            <div className="text-xs text-base-content/60">{tx.model}</div>
                          )}
                        </td>
                        <td className={`text-right font-mono font-semibold ${colorClass}`}>
                          {formatCredits(tx.amount)}
                        </td>
                        <td className="text-right text-base-content/60 text-sm">
                          {formatTimestamp(tx.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}