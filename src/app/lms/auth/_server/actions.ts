'use server';

import {
	getLmsCredentials,
	hasLmsCredentials,
	upsertLmsCredentials,
} from '@auth/auth-providers/_server/repository';
import { auth } from '@/core/auth';
import { moodleGet } from '@/core/integrations/moodle';

export async function checkMoodleUserExists() {
	const session = await auth();
	if (!session?.user?.email) {
		return { exists: false, error: 'No email found in session' };
	}

	const creds = session.user.id
		? await getLmsCredentials(session.user.id)
		: null;

	try {
		const response = await moodleGet(
			'core_user_get_users',
			{
				'criteria[0][key]': 'email',
				'criteria[0][value]': session.user.email,
			},
			process.env.MOODLE_TOKEN
		);

		if (response?.users && Array.isArray(response.users)) {
			const moodleUser = response.users[0] as
				| { id?: number; email?: string }
				| undefined;

			if (
				moodleUser?.id &&
				session.user.id &&
				creds?.lmsUserId !== moodleUser.id
			) {
				await upsertLmsCredentials(
					session.user.id,
					moodleUser.id,
					creds?.lmsToken ?? null
				);
			}

			return {
				exists: response.users.length > 0,
				user: moodleUser || null,
			};
		}

		return { exists: false };
	} catch (error) {
		console.error('Error checking Moodle user:', error);
		return { exists: false, error: 'Failed to check Moodle user' };
	}
}

export async function getLmsAuthStatus() {
	const session = await auth();
	if (!session?.user?.id) {
		return { hasCredentials: false, moodleCheck: null };
	}

	const hasCreds = await hasLmsCredentials(session.user.id);
	if (hasCreds) {
		return { hasCredentials: true, moodleCheck: null };
	}

	const moodleCheck = await checkMoodleUserExists();
	return { hasCredentials: false, moodleCheck };
}
