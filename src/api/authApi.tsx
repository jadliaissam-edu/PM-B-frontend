import { AUTH_BASE_URL } from "../config/baseURL.jsx";


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
