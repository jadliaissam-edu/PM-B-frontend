import { IA_REPO_BASE_URL } from "../config/baseURL";
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
 * Appelle l'IA pour analyser un dépôt spécifique
 */
export async function analyzeRepo(payload: RepoAnalysisRequest): Promise<RepoAnalysisResponse> {
    const authHeaders = await getAuthHeaders();

    const res = await fetch(`${IA_REPO_BASE_URL}/repo`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Erreur IA : ${res.status}`);
    }

    return res.json();
}
