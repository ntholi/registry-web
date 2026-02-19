'use server';

import { usersRepository } from '@admin/users/_server/repository';
import { auth } from '@/core/auth';
import { moodleGet } from '@/core/integrations/moodle';

export async function checkMoodleUserExists() {
	const session = await auth();
	if (!session?.user?.email) {
		return { exists: false, error: 'No email found in session' };
	}

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
				session.user.lmsUserId !== moodleUser.id
			) {
				await usersRepository.updateUserLmsUserId(
					session.user.id,
					moodleUser.id
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
