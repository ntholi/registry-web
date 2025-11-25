const MOODLE_URL = process.env.MOODLE_URL;
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
	params: Record<string, string | number | boolean | undefined> = {}
) {
	return moodleRequest(wsfunction, 'GET', params);
}

export async function moodlePost(
	wsfunction: string,
	params: Record<string, string | number | boolean | undefined> = {}
) {
	return moodleRequest(wsfunction, 'POST', params);
}

async function moodleRequest(
	wsfunction: string,
	method: Method,
	params: Record<string, string | number | boolean | undefined> = {}
) {
	const url = new URL(`${MOODLE_URL}/webservice/rest/server.php`);

	const requestParams: Record<string, string> = {
		wstoken: MOODLE_TOKEN,
		wsfunction,
		moodlewsrestformat: 'json',
	};

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) {
			requestParams[key] = String(value);
		}
	}

	console.log(`[Moodle] Requesting ${wsfunction}`, {
		...requestParams,
		wstoken: '***',
	});

	const formData =
		method === 'POST' ? new URLSearchParams(requestParams) : undefined;

	try {
		const response = await fetch(url.toString(), {
			method,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: formData?.toString(),
		});

		if (!response.ok) {
			throw new Error(`Moodle API request failed: ${response.statusText}`);
		}

		const data = await response.json();

		if (data.exception) {
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
