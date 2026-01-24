import { getOrCreateApplicantForCurrentUser } from '@admissions/applicants';
import { findApplicationsByApplicant } from '@admissions/applications';
import { findActiveIntakePeriod } from '@admissions/intake-periods';
import { redirect } from 'next/navigation';
import { auth } from '@/core/auth';

export default async function ApplyNewPage() {
	const session = await auth();

	if (!session?.user?.id) {
		redirect('/auth/login?callbackUrl=/apply/new');
	}

	const applicant = await getOrCreateApplicantForCurrentUser();

	if (!applicant) {
		redirect('/auth/login?callbackUrl=/apply/new');
	}

	const activeIntake = await findActiveIntakePeriod();

	if (!activeIntake) {
		redirect('/apply?error=no-active-intake');
	}

	const existingApplications = await findApplicationsByApplicant(applicant.id);
	const existingForIntake = existingApplications.find(
		(app) => app.intakePeriodId === activeIntake.id
	);

	if (existingForIntake) {
		if (existingForIntake.status === 'draft') {
			redirect(`/apply/${existingForIntake.id}/documents`);
		}
		redirect(`/apply/${existingForIntake.id}/thank-you`);
	}

	redirect('/apply/wizard/documents');
}
