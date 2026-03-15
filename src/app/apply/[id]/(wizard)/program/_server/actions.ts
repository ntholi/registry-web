'use server';

import { getEligibleProgramsForApplicant } from '@admissions/applicants';
import { findApplicationsByApplicant } from '@admissions/applications';
import {
	findActiveIntakePeriod,
	getOpenProgramIds,
} from '@admissions/intake-periods/_server/actions';
import { createAction, unwrap } from '@/shared/lib/utils/actionResult';

export const getEligiblePrograms = createAction(async (applicantId: string) => {
	const [allEligible, activeIntake] = await Promise.all([
		getEligibleProgramsForApplicant(applicantId).then(unwrap),
		findActiveIntakePeriod().then(unwrap),
	]);

	if (!activeIntake) return allEligible;

	const openProgramIds = unwrap(await getOpenProgramIds(activeIntake.id));

	if (openProgramIds.length === 0) return allEligible;

	return allEligible.filter((p) => openProgramIds.includes(p.id));
});

export const getActiveIntake = createAction(
	async () => (await findActiveIntakePeriod().then(unwrap)) ?? null
);

export const getExistingApplication = createAction(
	async (applicantId: string) => {
		const applications = unwrap(await findApplicationsByApplicant(applicantId));
		return (
			applications.find((app: { status: string }) => app.status === 'draft') ??
			null
		);
	}
);
