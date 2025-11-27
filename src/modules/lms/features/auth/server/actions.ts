'use server';

import { auth } from '@/core/auth';
import { moodleGet } from '@/core/integrations/moodle';

export async function checkMoodleUserExists() {
	const session = await auth();
	if (!session?.user?.email) {
		return { exists: false, error: 'No email found in session' };
	}

	try {
		const response = await moodleGet('core_user_get_users', {
			'criteria[0][key]': 'email',
			'criteria[0][value]': session.user.email,
		});

		if (response?.users && Array.isArray(response.users)) {
			return {
				exists: response.users.length > 0,
				user: response.users[0] || null,
			};
		}

		return { exists: false };
	} catch (error) {
		console.error('Error checking Moodle user:', error);
		return { exists: false, error: 'Failed to check Moodle user' };
	}
}
