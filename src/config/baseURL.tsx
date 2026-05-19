const API_BASE_URL = "/api";
const AUTH_BASE_URL = `${API_BASE_URL}/auth`;
const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const IA_BASE_URL = isLocal ? "http://localhost:8000/api/ia" : "https://91.107.205.217/api/ia";
const IA_REPO_BASE_URL = IA_BASE_URL;

export { API_BASE_URL, AUTH_BASE_URL, IA_BASE_URL, IA_REPO_BASE_URL };