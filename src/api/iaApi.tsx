/**
 * iaApi.tsx
 * ---------
 * Client API pour le service IA Python (PM-B-ia).
 *
 * Nettoyage effectué :
 *   - Toute logique liée à la "GitHub App" (OAuth, client_id, token exchange)
 *     a été supprimée.
 *   - L'accès aux dépôts privés se fait désormais exclusivement via un
 *     Personal Access Token (PAT) fourni par l'utilisateur.
 */

import { IA_REPO_BASE_URL, IA_BASE_URL, API_BASE_URL } from "../config/baseURL";
import { getAuthHeaders } from "./jwtService";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RepoInfo {
    owner:        string;
    repo:         string;
    branch:       string;
    /** true si le dépôt est privé — déclenche l'utilisation du PAT en backend */
    is_private:   boolean;
    /**
     * PAT GitHub en clair, transmis uniquement lors de l'ajout/modification
     * d'un dépôt privé. N'est JAMAIS stocké côté frontend (pas de localStorage).
     */
    github_token?: string;
}

export interface RepoAnalysisRequest {
    repositories: Omit<RepoInfo, "github_token">[];
    user_query:   string;
    user_id:      string;
}

export interface RepoAnalysisResponse {
    response:   string;
    model:      string;
    files_used: string[];
}

export interface AddRepoPayload {
    owner:         string;
    repo:          string;
    branch:        string;
    is_private:    boolean;
    github_token?: string;   // Requis si is_private=true
    user_id:       string;
}

// ─── Endpoints ──────────────────────────────────────────────────────────────

/**
 * Ajoute un dépôt GitHub pour l'utilisateur courant.
 * Si le dépôt est privé, le PAT est transmis et chiffré côté backend.
 * Le PAT n'est JAMAIS stocké en localStorage ni en état React après soumission.
 */
export async function addRepository(payload: AddRepoPayload): Promise<{ status: string; full_name: string; is_private: boolean }> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${IA_BASE_URL}/repos/add`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body:    JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Erreur lors de l'ajout du dépôt");
    }
    return res.json();
}

export interface GithubRepositoryResponseDto {
    id: string;
    userId: string;
    repoOwner: string;
    repoName: string;
    branch: string;
    isPrivate?: boolean;
    private?: boolean;
    tokenStored: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * Récupère tous les dépôts configurés pour un utilisateur depuis le backend (sans PAT).
 */
export async function getRepositories(userId: string): Promise<GithubRepositoryResponseDto[]> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/repos/${userId}`, {
        method:  "GET",
        headers: { "Content-Type": "application/json", ...authHeaders },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Erreur lors de la récupération des dépôts");
    }
    return res.json();
}
/**
 * Vérifie si un dépôt GitHub existe et est accessible.
 * Pour les dépôts privés, le token est envoyé une seule fois pour validation.
 */
export async function validateRepo(
    repo: Pick<RepoInfo, "owner" | "repo" | "branch" | "is_private" | "github_token">
): Promise<{ status: string; private?: boolean }> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${IA_REPO_BASE_URL}/validate`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body:    JSON.stringify(repo),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Dépôt invalide ou inaccessible");
    }
    return res.json();
}

/**
 * Lance l'indexation manuelle des dépôts (sans PAT — uniquement dépôts publics
 * ou dépôts dont le token est déjà en BDD côté backend).
 */
export async function indexRepositories(
    payload: { repositories: Omit<RepoInfo, "github_token">[] }
): Promise<{ message: string }> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${IA_REPO_BASE_URL}/index`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body:    JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Erreur d'indexation");
    }
    return res.json();
}

/**
 * Appelle l'IA pour analyser un ou plusieurs dépôts GitHub et
 * répondre à la question de l'utilisateur.
 * Les PAT des dépôts privés sont récupérés et déchiffrés côté backend.
 */
export async function analyzeRepo(payload: RepoAnalysisRequest): Promise<RepoAnalysisResponse> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${IA_REPO_BASE_URL}/repo`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body:    JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Erreur IA : ${res.status}`);
    }
    return res.json();
}

// ─── Generate Entity ─────────────────────────────────────────────────────────

export type EntityIntent = "task" | "workspace" | "space" | "sprint" | "liste" | "folder" | "unknown";

export interface GenerateEntityRequest {
    user_query:   string;
    context?:     {
        workspaceId?: string;
        spaceId?:     string;
        listeId?:     string;
        sprintId?:    string;
        [key: string]: any;
    };
    repositories?: Omit<RepoInfo, "github_token">[];
    user_id?:      string;
}

export interface GenerateEntityResponse {
    intent:      EntityIntent;
    entity:      Record<string, any> | null;
    endpoint:    string | null;
    explanation: string;
}

/**
 * Demande à l'IA de détecter l'intention et de générer les données d'une entité.
 */
export async function generateEntity(
    payload: GenerateEntityRequest,
    signal?: AbortSignal
): Promise<GenerateEntityResponse> {
    const res = await fetch(`${IA_BASE_URL}/generate`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Erreur IA generate : ${res.status}`);
    }
    return res.json();
}

/**
 * Génère une description ou un objectif pour une entité spécifique.
 */
export async function askAI(
    entityType: string,
    entityName: string
): Promise<{ generated_text: string }> {
    const res = await fetch(`${IA_BASE_URL}/ask-ai`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ entity_type: entityType, entity_name: entityName }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Erreur Ask AI : ${res.status}`);
    }
    return res.json();
}
