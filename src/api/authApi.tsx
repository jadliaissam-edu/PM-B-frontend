const AUTH_BASE_URL = "/api/auth";

export async function login(payload: Record<string, unknown>): Promise<any> {
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

export async function register(payload: Record<string, unknown>): Promise<any> {
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