type ApplicantData = {
	fullName: string | null;
	documents: Array<{ document: { type: string | null } }>;
	academicRecords: unknown[];
	guardians: unknown[];
};

type ApplicationData = {
	firstChoiceProgramId: number | null;
};

export type WizardStep =
	| 'identity'
	| 'qualifications'
	| 'program'
	| 'personal-info'
	| 'review';

export function computeWizardStep(
	applicant: ApplicantData | null | undefined,
	application?: ApplicationData | null
): WizardStep {
	if (!applicant) return 'identity';

	const hasIdentity = applicant.documents.some(
		(d) => d.document.type === 'identity'
	);
	const hasQualifications = applicant.academicRecords.length > 0;
	const hasFirstChoice = !!application?.firstChoiceProgramId;
	const hasPersonalInfo =
		!!applicant.fullName && applicant.guardians.length > 0;

	if (!hasIdentity || !hasQualifications) return 'identity';
	if (!hasFirstChoice) return 'qualifications';
	if (!hasPersonalInfo) return 'program';
	return 'personal-info';
}
