import { findApplicantByUserId } from '@/app/admissions/applicants';
import { auth } from '@/core/auth';

export async function getCurrentApplicant() {
	const session = await auth();
	if (!session?.user?.id) return null;
	return findApplicantByUserId(session.user.id);
}
