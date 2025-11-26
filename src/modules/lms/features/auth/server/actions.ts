'use server';

import { auth } from '@/core/auth';
import { lmsAuthRepository } from './repository';

export async function getLmsUserId(): Promise<number | null> {
	const session = await auth();

	if (!session?.user?.id) {
		return null;
	}

	return lmsAuthRepository.getLmsUserId(session.user.id);
}
