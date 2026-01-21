'use server';

import { getEligibleProgramsForApplicant } from '@admissions/applicants';
import { findApplicationsByApplicant } from '@admissions/applications';
import { findActiveIntakePeriod } from '@admissions/intake-periods/_server/actions';

export async function getEligiblePrograms(applicantId: string) {
	return getEligibleProgramsForApplicant(applicantId);
}

export async function getActiveIntake() {
	return (await findActiveIntakePeriod()) ?? null;
}

export async function getExistingApplication(applicantId: string) {
	const applications = await findApplicationsByApplicant(applicantId);
	return (
		applications.find((app: { status: string }) => app.status === 'draft') ??
		null
	);
}
