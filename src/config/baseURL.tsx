const API_BASE_URL = "/api";
const AUTH_BASE_URL = `${API_BASE_URL}/auth`;
// IP directe de l'instance IA pour éviter les problèmes de proxy en développement et en production
const IA_BASE_URL = "http://138.199.225.78:8000/api/ia";
const IA_REPO_BASE_URL = IA_BASE_URL;

export { API_BASE_URL, AUTH_BASE_URL, IA_BASE_URL, IA_REPO_BASE_URL };