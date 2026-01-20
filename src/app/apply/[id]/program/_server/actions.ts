'use server';

import { getEligibleProgramsForApplicant } from '@admissions/applicants';
import { findActiveIntakePeriod } from '@admissions/intake-periods/_server/actions';

export async function getEligiblePrograms(applicantId: string) {
	return getEligibleProgramsForApplicant(applicantId);
}

export async function getActiveIntake() {
	return findActiveIntakePeriod();
}
