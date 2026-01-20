'use server';

import { getEligibleProgramsForApplicant } from '@admissions/applicants';
import {
	findApplicationsByApplicant,
	getApplication,
	updateApplication,
} from '@admissions/applications';
import { findActiveIntakePeriod } from '@admissions/intake-periods/_server/actions';

export async function getEligiblePrograms(applicantId: string) {
	return getEligibleProgramsForApplicant(applicantId);
}

export async function getActiveIntake() {
	return findActiveIntakePeriod();
}

export async function getExistingApplication(applicantId: string) {
	const applications = await findApplicationsByApplicant(applicantId);
	return applications.find((app: { status: string }) => app.status === 'draft');
}

export async function updateProgramChoices(
	applicationId: string,
	firstChoiceProgramId: number,
	secondChoiceProgramId: number | null
) {
	const existing = await getApplication(applicationId);
	if (!existing) {
		throw new Error('Application not found');
	}
	return updateApplication(applicationId, {
		...existing,
		firstChoiceProgramId,
		secondChoiceProgramId,
	});
}
