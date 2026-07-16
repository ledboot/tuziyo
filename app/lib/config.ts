const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

export const API_BASE = (configuredApiBaseUrl || "http://localhost:8787").replace(/\/+$/, "")
