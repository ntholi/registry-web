'use server';

import { getApplicant } from '@admissions/applicants';
import {
	type Application,
	changeApplicationStatus,
	findApplicationsByApplicant,
} from '@admissions/applications';
import { createAction, unwrap } from '@/shared/lib/actions/actionResult';

export async function getApplicantWithApplication(applicantId: string) {
	const [applicant, applications] = await Promise.all([
		getApplicant(applicantId),
		findApplicationsByApplicant(applicantId),
	]);

	const application = applications.find(
		(app: Application) => app.status === 'draft' || app.status === 'submitted'
	);

	return { applicant, application };
}

export const submitApplication = createAction(async (applicationId: string) => {
	unwrap(await changeApplicationStatus(applicationId, 'submitted'));
});
