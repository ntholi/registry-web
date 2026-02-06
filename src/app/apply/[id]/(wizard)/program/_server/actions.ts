'use server';

import { getEligibleProgramsForApplicant } from '@admissions/applicants';
import { findApplicationsByApplicant } from '@admissions/applications';
import {
	findActiveIntakePeriod,
	getOpenProgramIds,
} from '@admissions/intake-periods/_server/actions';

export async function getEligiblePrograms(applicantId: string) {
	const [allEligible, activeIntake] = await Promise.all([
		getEligibleProgramsForApplicant(applicantId),
		findActiveIntakePeriod(),
	]);

	if (!activeIntake) return allEligible;

	const openProgramIds = await getOpenProgramIds(activeIntake.id);

	if (openProgramIds.length === 0) return allEligible;

	return allEligible.filter((p) => openProgramIds.includes(p.id));
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
