import { API_BASE_URL, AUTH_BASE_URL } from "../config/baseURL";

let refreshInFlight: Promise<string | null> | null = null;

function redirectToLogin(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    if (window.location.pathname !== "/login") {
        window.location.href = "/login";
    }
}

async function pingAccessToken(accessToken: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/ping`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return response.status === 200;
    } catch {
        return false;
    }
}

async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
        return null;
    }

    try {
        const response = await fetch(`${AUTH_BASE_URL}/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            return null;
        }

        const data = (await response.json()) as { accessToken?: string; refreshToken?: string };
        if (!data.accessToken) {
            return null;
        }

        localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken) {
            localStorage.setItem("refreshToken", data.refreshToken);
        }

        return data.accessToken;
    } catch {
        return null;
    }
}

async function getRefreshedTokenOnce(): Promise<string | null> {
    if (!refreshInFlight) {
        refreshInFlight = refreshAccessToken().finally(() => {
            refreshInFlight = null;
        });
    }

    return refreshInFlight;
}

export async function getAuthHeaders(): Promise<HeadersInit> {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
        const isAccessTokenValid = await pingAccessToken(accessToken);
        if (isAccessTokenValid) {
            return { Authorization: `Bearer ${accessToken}` };
        }
    }

    // alert("Accesstoken expire , tentnive de refresh...");
    const refreshedAccessToken = await getRefreshedTokenOnce();

    if (refreshedAccessToken) {
        return { Authorization: `Bearer ${refreshedAccessToken}` };
    }

    redirectToLogin();
    return {};
}
