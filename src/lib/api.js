import axios from "axios";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

export function imageUrl(url) {
  if (!url) return "";
  return url.startsWith("/api") ? `${BACKEND_URL}${url}` : url;
}

export function formatApiError(error) {
  const detail = error?.response?.data?.detail;
  if (detail == null) return error?.message || "Something went wrong. Try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
