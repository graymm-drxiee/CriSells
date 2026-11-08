interface RequestOptions {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: unknown;
	signal?: AbortSignal;
}

/** Thin fetch wrapper: JSON in, JSON out, server error messages as thrown Errors. */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const res = await fetch(path, {
		method: options.method ?? "GET",
		credentials: "same-origin",
		headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
		body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
		signal: options.signal,
	});
	const data = await res.json().catch(() => null);
	if (!res.ok) {
		throw new Error((data as { error?: string } | null)?.error || `Request failed (${res.status}).`);
	}
	if (data === null) throw new Error("The server returned an unexpected response.");
	return data as T;
}
