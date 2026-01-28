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
	| 'documents'
	| 'qualifications'
	| 'program'
	| 'personal-info'
	| 'review';

export function computeWizardStep(
	applicant: ApplicantData | null | undefined,
	application?: ApplicationData | null
): WizardStep {
	if (!applicant) return 'documents';

	const hasIdentity = applicant.documents.some(
		(d) => d.document.type === 'identity'
	);
	const hasQualifications = applicant.academicRecords.length > 0;
	const hasFirstChoice = !!application?.firstChoiceProgramId;
	const hasPersonalInfo =
		!!applicant.fullName && applicant.guardians.length > 0;

	if (!hasIdentity) return 'documents';
	if (!hasQualifications) return 'qualifications';
	if (!hasFirstChoice) return 'program';
	if (!hasPersonalInfo) return 'personal-info';
	return 'review';
}
