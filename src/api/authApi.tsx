import { AUTH_BASE_URL } from "../config/baseURL";

interface LogoutPayload {
	refreshToken?: string;
}


export async function login(payload: Record<string, any>) {
	const response = await fetch(`${AUTH_BASE_URL}/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload)
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || data.error || "Login failed");
	}

	return data;
}

export async function register(payload: Record<string, any>) {
	const response = await fetch(`${AUTH_BASE_URL}/register`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload)
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || data.error || "Registration failed");
	}

	return data;
}

export async function verifyMfa(payload: Record<string, any>) {
	const response = await fetch(`${AUTH_BASE_URL}/mfa/verify`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload)
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || data.error || "MFA verification failed");
	}

	return data;
}

export async function logout(payload: LogoutPayload = {}) {
	const response = await fetch(`${AUTH_BASE_URL}/logout`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload)
	});

	const contentType = response.headers.get("content-type") || "";
	const data = contentType.includes("application/json") ? await response.json() : null;

	if (!response.ok) {
		throw new Error(data?.message || data?.error || "Logout failed");
	}

	return data;
}
