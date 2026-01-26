'use server';

import { getApplicant } from '@admissions/applicants';
import {
	changeApplicationStatus,
	findApplicationsByApplicant,
} from '@admissions/applications';
import { type ActionResult, extractError } from '@apply/_lib/actions';

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

export async function submitApplication(
	applicationId: string
): Promise<ActionResult<void>> {
	try {
		await changeApplicationStatus(applicationId, 'submitted');
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}
