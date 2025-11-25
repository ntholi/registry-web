const MOODLE_URL = process.env.MOODLE_URL || 'http://localhost';
const MOODLE_TOKEN = process.env.MOODLE_TOKEN || '';

export async function moodleRequest(
	wsfunction: string,
	params: Record<string, string | number | boolean | undefined> = {}
) {
	const url = new URL(`${MOODLE_URL}/webservice/rest/server.php`);

	const formData = new URLSearchParams({
		wstoken: MOODLE_TOKEN,
		wsfunction,
		moodlewsrestformat: 'json',
		...params,
	});

	try {
		const response = await fetch(url.toString(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: formData.toString(),
		});

		if (!response.ok) {
			throw new Error(`Moodle API request failed: ${response.statusText}`);
		}

		const data = await response.json();

		if (data.exception) {
			throw new Error(`Moodle error: ${data.message || data.exception}`);
		}

		return data;
	} catch (error) {
		console.error('Moodle API Error:', error);
		throw error;
	}
}
