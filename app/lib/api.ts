const API_BASE = import.meta.env.DEV ? "http://localhost:8787" : "https://api.tuziyo.com";

function getToken(): string | null {
  try {
    const stored = localStorage.getItem("tuziyo-user-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.token || null;
    }
  } catch {
  }
  return null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

export const api = {
  auth: {
    me: () => request<{ user: { userId: string; email: string; name: string; avatarUrl?: string } | null }>("/api/auth/me"),
    logout: () => request("/api/auth/logout", { method: "POST" }),
  },

  models: {
    list: () => request<{ models: Array<{ id: string; name: string; provider: string; icon: string }> }>("/api/models"),
  },

  credits: {
    get: () => request<{ credits: { balance: number; total_purchased: number; total_used: number } }>("/api/credits"),
  },

  transactions: {
    list: (limit = 50) => request<{ transactions: Array<{ id: string; amount: number; type: string; description: string; model: string | null; credits_per_image: number | null; created_at: number }>; total: number }>(`/api/transactions?limit=${limit}`),
  },

  sessions: {
    list: () => request<{ sessions: Array<{ id: string; title: string; is_pinned: number; preview_image: string | null; created_at: number; updated_at: number }> }>("/api/sessions"),
    create: (title: string) => request<{ session: { id: string; title: string; is_pinned: number; created_at: number; updated_at: number } }>("/api/sessions", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
    get: (id: string) => request<{ session: { id: string; title: string }; messages: Array<{ id: string; role: string; prompt: string; model: string; image_url?: string }> }>(`/api/sessions/${id}`),
    delete: (id: string) => request(`/api/sessions/${id}`, { method: "DELETE" }),
    update: (id: string, data: { title?: string; is_pinned?: number }) => request(`/api/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  },

  generate: {
    create: (params: {
      prompt: string;
      model: string;
      sessionId?: string;
      provider?: string;
      size?: string;
      quality?: string;
      style?: string;
      aspect_ratio?: string;
      resolution?: string;
      output_format?: string;
      num_images?: number;
      negative_prompt?: string;
    }) => request<{ success: boolean; key?: string; error?: string }>("/api/generate", {
      method: "POST",
      body: JSON.stringify(params),
    }),
  },

  stripe: {
    products: () => request<{ products: Array<{ id: string; product_id: string; product_name: string; product_description: string; unit_amount: number; currency: string; interval: string | null; features: string[]; credits: number; images: number; sort: number; recommend: boolean }> }>("/api/stripe/products"),
    checkout: (priceId: string) => request<{ url: string }>("/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ priceId }),
    }),
    subscription: () => request<{ subscription: unknown }>("/api/stripe/subscription"),
    portal: () => request<{ url: string }>("/api/stripe/portal", { method: "POST" }),
  },
};

export type Api = typeof api;