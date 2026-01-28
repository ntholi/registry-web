import {
	canCurrentUserApply,
	getOrCreateApplicantForCurrentUser,
} from '@admissions/applicants';
import { findApplicationsByApplicant } from '@admissions/applications';
import { findActiveIntakePeriod } from '@admissions/intake-periods';
import { redirect } from 'next/navigation';
import { auth } from '@/core/auth';

function computeWizardStep(
	applicant: Awaited<ReturnType<typeof getOrCreateApplicantForCurrentUser>>,
	application?: { firstChoiceProgramId: number | null }
) {
	if (!applicant) return 'documents';

	const hasIdentity = applicant.documents.some(
		(d) => d.document.type === 'identity'
	);
	const hasQualifications = applicant.academicRecords.length > 0;
	const hasFirstChoice = !!application?.firstChoiceProgramId;
	const hasPersonalInfo =
		!!applicant.fullName && applicant.guardians.length > 0;

	if (!hasIdentity) return 'documents';
	if (!hasQualifications) return 'qualifications';
	if (!hasFirstChoice) return 'program';
	if (!hasPersonalInfo) return 'personal-info';
	return 'review';
}

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
	redirect(`/apply/draft/${step}`);
}
