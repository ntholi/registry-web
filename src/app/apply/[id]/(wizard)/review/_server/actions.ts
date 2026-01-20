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

	const draftApplication = applications.find(
		(app: { status: string }) => app.status === 'draft'
	);

	return { applicant, application: draftApplication };
}

export async function submitApplication(applicationId: string) {
	return changeApplicationStatus(applicationId, 'submitted');
}
