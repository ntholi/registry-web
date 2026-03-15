'use server';

import { getApplicant } from '@admissions/applicants';
import {
	changeApplicationStatus,
	findApplicationsByApplicant,
} from '@admissions/applications';
import { createAction, unwrap } from '@/shared/lib/utils/actionResult';

export async function getApplicantWithApplication(applicantId: string) {
	const [applicant, applications] = await Promise.all([
		getApplicant(applicantId).then(unwrap),
		findApplicationsByApplicant(applicantId).then(unwrap),
	]);

	const application = applications.find(
		(app: { status: string }) =>
			app.status === 'draft' || app.status === 'submitted'
	);

	return { applicant, application };
}

export const submitApplication = createAction(async (applicationId: string) => {
	await unwrap(await changeApplicationStatus(applicationId, 'submitted'));
});
