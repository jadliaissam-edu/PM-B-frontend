import { IA_REPO_BASE_URL, IA_BASE_URL } from "../config/baseURL";
import { getAuthHeaders } from "./jwtService";

export interface RepoInfo {
    owner: string;
    repo: string;
    branch: string;
}

export interface RepoAnalysisRequest {
    repositories: RepoInfo[];
    user_query: string;
}

export interface RepoAnalysisResponse {
    response: string;
    model: string;
    files_used: string[];
}

/**
 * Vérifie si un dépôt existe
 */
export async function validateRepo(repo: RepoInfo): Promise<{ status: string }> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${IA_REPO_BASE_URL}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(repo),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Dépôt invalide");
    }
    return res.json();
}

/**
 * Lance l'indexation manuelle des dépôts
 */
export async function indexRepositories(payload: { repositories: RepoInfo[] }): Promise<{ message: string }> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${IA_REPO_BASE_URL}/index`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Erreur d'indexation");
    }
    return res.json();
}

/**
 * Appelle l'IA pour analyser un dépôt spécifique
 */
export async function analyzeRepo(payload: RepoAnalysisRequest): Promise<RepoAnalysisResponse> {
    console.log("iaApi: Récupération des headers d'authentification...");
    const authHeaders = await getAuthHeaders();
    console.log("iaApi: Headers récupérés, lancement du fetch sur", `${IA_REPO_BASE_URL}/repo`);

    const res = await fetch(`${IA_REPO_BASE_URL}/repo`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders,
        },
        body: JSON.stringify(payload),
    });
    console.log("iaApi: Réponse du fetch reçue, statut:", res.status);

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Erreur IA : ${res.status}`);
    }

    return res.json();
}

// ---------------------------------------------------------------
// Generate Entity (intent detection + structured JSON)
// ---------------------------------------------------------------

export type EntityIntent = "task" | "workspace" | "space" | "sprint" | "liste" | "folder" | "unknown";

export interface GenerateEntityRequest {
    user_query: string;
    context?: {
        workspaceId?: string;
        spaceId?: string;
        listeId?: string;
        sprintId?: string;
        members?: Array<{ id: string; name: string }>;
    };
    repositories?: RepoInfo[];
}

export interface GenerateEntityResponse {
    intent: EntityIntent;
    entity: Record<string, any> | Array<Record<string, any>> | null;
    endpoint: string | null;
    explanation: string;
}

/**
 * Demande à l'IA de détecter l'intention et générer les données d'une entité
 */
export async function generateEntity(
    payload: GenerateEntityRequest
): Promise<GenerateEntityResponse> {
    const res = await fetch(`${IA_BASE_URL}/api/ia/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Erreur IA generate : ${res.status}`);
    }
    return res.json();
}
