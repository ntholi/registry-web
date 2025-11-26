'use server';

import { auth } from '@/core/auth';
import { moodleGet } from '@/core/integrations/moodle';
import { lmsAuthRepository } from './repository';

export type MoodleUser = {
	id: number;
	username: string;
	firstname: string;
	lastname: string;
	fullname: string;
	email: string;
};

export async function getMoodleUserByEmail(
	email: string
): Promise<MoodleUser | null> {
	try {
		const result = await moodleGet('core_user_get_users', {
			'criteria[0][key]': 'email',
			'criteria[0][value]': email,
		});

		if (result?.users && result.users.length > 0) {
			return result.users[0] as MoodleUser;
		}

		return null;
	} catch (error) {
		console.error('Error fetching Moodle user:', error);
		return null;
	}
}

export async function checkMoodleAuth(): Promise<{
	isAuthenticated: boolean;
	lmsUserId: number | null;
	needsLinking: boolean;
}> {
	const session = await auth();

	if (!session?.user?.id) {
		return { isAuthenticated: false, lmsUserId: null, needsLinking: false };
	}

	const lmsUserId = await lmsAuthRepository.getLmsUserId(session.user.id);

	if (lmsUserId) {
		return { isAuthenticated: true, lmsUserId, needsLinking: false };
	}

	if (session.user.email) {
		const moodleUser = await getMoodleUserByEmail(session.user.email);

		if (moodleUser) {
			await lmsAuthRepository.setLmsUserId(session.user.id, moodleUser.id);
			return {
				isAuthenticated: true,
				lmsUserId: moodleUser.id,
				needsLinking: false,
			};
		}
	}

	return { isAuthenticated: false, lmsUserId: null, needsLinking: true };
}

export async function linkMoodleAccount(): Promise<{
	success: boolean;
	error?: string;
}> {
	const session = await auth();

	if (!session?.user?.id || !session.user.email) {
		return { success: false, error: 'Not authenticated' };
	}

	const existingLmsUserId = await lmsAuthRepository.getLmsUserId(
		session.user.id
	);
	if (existingLmsUserId) {
		return { success: true };
	}

	const moodleUser = await getMoodleUserByEmail(session.user.email);

	if (!moodleUser) {
		return {
			success: false,
			error:
				'No Moodle account found for your email. Please contact the administrator to create your Moodle account.',
		};
	}

	await lmsAuthRepository.setLmsUserId(session.user.id, moodleUser.id);
	return { success: true };
}

export async function getCurrentMoodleUser(): Promise<MoodleUser | null> {
	const session = await auth();

	if (!session?.user?.email) {
		return null;
	}

	return getMoodleUserByEmail(session.user.email);
}
