import { z } from 'zod/v4';

const envSchema = z.object({
	ZOHO_BOOKS_CLIENT_ID: z.string().min(1),
	ZOHO_BOOKS_CLIENT_SECRET: z.string().min(1),
	ZOHO_BOOKS_REFRESH_TOKEN: z.string().min(1),
	ZOHO_BOOKS_ORGANIZATION_ID: z.string().min(1),
	ZOHO_BOOKS_ACCOUNTS_URL: z
		.string()
		.url()
		.default('https://accounts.zoho.com'),
	ZOHO_BOOKS_API_BASE_URL: z
		.string()
		.url()
		.default('https://www.zohoapis.com/books/v3'),
});

interface ZohoErrorResponse {
	error?: string;
	code?: number;
	message?: string;
}

function getConfig() {
	return envSchema.parse({
		ZOHO_BOOKS_CLIENT_ID: process.env.ZOHO_BOOKS_CLIENT_ID,
		ZOHO_BOOKS_CLIENT_SECRET: process.env.ZOHO_BOOKS_CLIENT_SECRET,
		ZOHO_BOOKS_REFRESH_TOKEN: process.env.ZOHO_BOOKS_REFRESH_TOKEN,
		ZOHO_BOOKS_ORGANIZATION_ID: process.env.ZOHO_BOOKS_ORGANIZATION_ID,
		ZOHO_BOOKS_ACCOUNTS_URL: process.env.ZOHO_BOOKS_ACCOUNTS_URL,
		ZOHO_BOOKS_API_BASE_URL: process.env.ZOHO_BOOKS_API_BASE_URL,
	});
}

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

async function refreshAccessToken(): Promise<string> {
	const config = getConfig();
	const params = new URLSearchParams({
		refresh_token: config.ZOHO_BOOKS_REFRESH_TOKEN,
		client_id: config.ZOHO_BOOKS_CLIENT_ID,
		client_secret: config.ZOHO_BOOKS_CLIENT_SECRET,
		grant_type: 'refresh_token',
	});

	const response = await fetch(
		`${config.ZOHO_BOOKS_ACCOUNTS_URL}/oauth/v2/token`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: params.toString(),
			cache: 'no-store',
		}
	);

	const data = (await response.json()) as {
		access_token?: string;
		expires_in?: number;
		error?: string;
	};

	if (!response.ok || data.error || !data.access_token || !data.expires_in) {
		throw new Error(
			`Zoho token refresh failed: ${response.status} ${data.error ?? response.statusText}`
		);
	}

	cachedAccessToken = data.access_token;
	tokenExpiresAt = Date.now() + Math.max(data.expires_in - 60, 30) * 1000;
	return cachedAccessToken;
}

async function getAccessToken(forceRefresh = false): Promise<string> {
	if (!forceRefresh && cachedAccessToken && Date.now() < tokenExpiresAt) {
		return cachedAccessToken;
	}
	return refreshAccessToken();
}

export async function zohoGet<T>(
	endpoint: string,
	params: Record<string, string> = {}
): Promise<T> {
	const config = getConfig();

	async function runRequest(token: string) {
		const searchParams = new URLSearchParams({
			organization_id: config.ZOHO_BOOKS_ORGANIZATION_ID,
			...params,
		});

		const url = `${config.ZOHO_BOOKS_API_BASE_URL}${endpoint}?${searchParams.toString()}`;
		return fetch(url, {
			headers: { Authorization: `Zoho-oauthtoken ${token}` },
			cache: 'no-store',
		});
	}

	let response = await runRequest(await getAccessToken());

	if (response.status === 401) {
		response = await runRequest(await getAccessToken(true));
	}

	if (response.status === 429) {
		throw new Error(
			'Zoho Books API rate limit reached. Please try again in a few minutes.'
		);
	}

	const raw = (await response.json()) as T & ZohoErrorResponse;

	if (
		!response.ok ||
		raw.error ||
		(typeof raw.code === 'number' && raw.code !== 0)
	) {
		throw new Error(
			`Zoho API error [${response.status}]: ${raw.message ?? raw.error ?? 'Unknown error'}`
		);
	}

	return raw;
}
