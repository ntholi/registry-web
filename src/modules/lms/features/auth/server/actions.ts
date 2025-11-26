'use server';

import { auth } from '@/core/auth';
import { lmsAuthRepository } from './repository';

export async function linkMoodleAccount(): Promise<{
	success: boolean;
	error?: string;
}> {
	const session = await auth();

	if (!session?.user?.id || !session?.user?.email) {
		return {
			success: false,
			error: 'You must be logged in to link your account',
		};
	}

	if (session.user.lmsUserId) {
		return {
			success: false,
			error: 'Your account is already linked to Moodle',
		};
	}

	const moodleUser = await lmsAuthRepository.findMoodleUserByEmail(
		session.user.email
	);

	if (!moodleUser) {
		return {
			success: false,
			error:
				'No Moodle account found with your email address. Please create a Moodle account first.',
		};
	}

	await lmsAuthRepository.linkMoodleAccount(session.user.id, moodleUser.id);

	return { success: true };
}
