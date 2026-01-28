import {
	canCurrentUserApply,
	getOrCreateApplicantForCurrentUser,
} from '@admissions/applicants';
import {
	createOrUpdateApplication,
	findApplicationsByApplicant,
} from '@admissions/applications';
import { findActiveIntakePeriod } from '@admissions/intake-periods';
import { computeWizardStep } from '@apply/_lib/wizard-utils';
import { redirect } from 'next/navigation';
import { auth } from '@/core/auth';

export default async function ApplyNewPage() {
	const session = await auth();

	if (!session?.user?.id) {
		redirect('/auth/login?callbackUrl=/apply/new');
	}

	const eligibility = await canCurrentUserApply();
	if (!eligibility.canApply) {
		redirect('/apply/restricted');
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
		const step = computeWizardStep(applicant, existingForIntake);

		if (existingForIntake.status === 'submitted') {
			redirect(`/apply/${existingForIntake.id}/thank-you`);
		}
		redirect(`/apply/${existingForIntake.id}/${step}`);
	}

	const step = computeWizardStep(applicant);
	const draftApplication = await createOrUpdateApplication({
		applicantId: applicant.id,
		intakePeriodId: activeIntake.id,
		firstChoiceProgramId: null,
		secondChoiceProgramId: null,
		status: 'draft',
	});
	redirect(`/apply/${draftApplication.id}/${step}`);
}
