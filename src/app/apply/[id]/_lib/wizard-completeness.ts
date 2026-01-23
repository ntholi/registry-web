'use server';

import { getApplicant } from '@admissions/applicants';
import { findApplicationsByApplicant } from '@admissions/applications';

type CompletenessResult = {
	isComplete: boolean;
	hasIdentity: boolean;
	hasQualifications: boolean;
	hasFirstChoice: boolean;
	hasPersonalInfo: boolean;
};

export async function checkWizardCompleteness(
	applicantId: string
): Promise<CompletenessResult> {
	const [applicant, applications] = await Promise.all([
		getApplicant(applicantId),
		findApplicationsByApplicant(applicantId),
	]);

	if (!applicant) {
		return {
			isComplete: false,
			hasIdentity: false,
			hasQualifications: false,
			hasFirstChoice: false,
			hasPersonalInfo: false,
		};
	}

	const hasIdentity = applicant.documents.some(
		(d) => d.document.type === 'identity'
	);

	const hasQualifications = applicant.academicRecords.length > 0;

	const application = applications.find(
		(app: { status: string }) =>
			app.status === 'draft' || app.status === 'submitted'
	);
	const hasFirstChoice = !!application?.firstChoiceProgramId;

	const hasPersonalInfo =
		!!applicant.fullName && applicant.guardians.length > 0;

	const isComplete =
		hasIdentity && hasQualifications && hasFirstChoice && hasPersonalInfo;

	return {
		isComplete,
		hasIdentity,
		hasQualifications,
		hasFirstChoice,
		hasPersonalInfo,
	};
}
