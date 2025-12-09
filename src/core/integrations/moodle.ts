import { auth } from '../auth';

const NEXT_PUBLIC_MOODLE_URL = process.env.NEXT_PUBLIC_MOODLE_URL;
const MOODLE_TOKEN = process.env.MOODLE_TOKEN || '';

export class MoodleError extends Error {
	exception: string;
	errorcode?: string;
	constructor(message: string, exception: string, errorcode?: string) {
		super(message);
		this.name = 'MoodleError';
		this.exception = exception;
		this.errorcode = errorcode;
	}
}

type Method = 'GET' | 'POST';

export async function moodleGet(
	wsfunction: string,
	params: Record<string, string | number | boolean | undefined> = {},
	lmsToken?: string
) {
	const session = await auth();
	return moodleRequest(
		wsfunction,
		'GET',
		params,
		lmsToken || session?.user?.lmsToken
	);
}

export async function moodlePost(
	wsfunction: string,
	params: Record<string, string | number | boolean | undefined> = {},
	lmsToken?: string
) {
	const session = await auth();
	return moodleRequest(
		wsfunction,
		'POST',
		params,
		lmsToken || session?.user?.lmsToken
	);
}

async function moodleRequest(
	wsfunction: string,
	method: Method,
	params: Record<string, string | number | boolean | undefined> = {},
	userToken?: string
) {
	const url = new URL(`${NEXT_PUBLIC_MOODLE_URL}/webservice/rest/server.php`);

	const token = userToken || MOODLE_TOKEN;
	url.searchParams.set('wstoken', token);
	url.searchParams.set('wsfunction', wsfunction);
	url.searchParams.set('moodlewsrestformat', 'json');

	let body: URLSearchParams | undefined;

	if (method === 'POST') {
		body = new URLSearchParams();
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined) {
				body.append(key, String(value));
			}
		}
	} else {
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined) {
				url.searchParams.set(key, String(value));
			}
		}
	}

	console.log(`[Moodle:${method}] ${wsfunction}`, {
		params,
		bodyParams: body?.toString(),
		url: url.toString().replace(token, '***'),
	});

	try {
		const response = await fetch(url.toString(), {
			method,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body,
		});

		if (!response.ok) {
			throw new Error(`Moodle API request failed: ${response.statusText}`);
		}

		const text = await response.text();

		console.log(`[Moodle Response:${method}] ${wsfunction}`, {
			status: response.status,
			text: text,
		});

		if (text.startsWith('<?xml') || text.startsWith('<')) {
			console.error(
				'Moodle returned XML instead of JSON:',
				text.substring(0, 500)
			);
			throw new Error(
				'Moodle API returned XML. Check if the web service is properly configured.'
			);
		}

		const data = JSON.parse(text);

		if (data?.exception) {
			throw new MoodleError(
				data.message || data.exception,
				data.exception,
				data.errorcode
			);
		}

		return data;
	} catch (error) {
		if (error instanceof MoodleError) {
			throw error;
		}
		console.error('Moodle API Error:', error);
		throw error;
	}
}
