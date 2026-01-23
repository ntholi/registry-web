'use server';

import { getApplicant } from '@admissions/applicants';
import {
	changeApplicationStatus,
	findApplicationsByApplicant,
} from '@admissions/applications';

export async function getApplicantWithApplication(applicantId: string) {
	const [applicant, applications] = await Promise.all([
		getApplicant(applicantId),
		findApplicationsByApplicant(applicantId),
	]);

	const application = applications.find(
		(app: { status: string }) =>
			app.status === 'draft' || app.status === 'submitted'
	);

	return { applicant, application };
}

export async function submitApplication(applicationId: string) {
	return changeApplicationStatus(applicationId, 'submitted');
}
