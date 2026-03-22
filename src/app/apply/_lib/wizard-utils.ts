import type { academicRecords } from '@admissions/academic-records/_schema/academicRecords';
import type { guardians } from '@admissions/applicants/_schema/guardians';

type ApplicantData = {
	fullName: string | null;
	documents: Array<{ document: { type: string | null } }>;
	academicRecords: (typeof academicRecords.$inferSelect)[];
	guardians: (typeof guardians.$inferSelect)[];
};

type ApplicationData = {
	firstChoiceProgramId: number | null;
};

export type WizardStepId =
	| 'identity'
	| 'qualifications'
	| 'program'
	| 'personal-info'
	| 'review';

export function computeWizardStep(
	applicant: ApplicantData | null | undefined,
	application?: ApplicationData | null
): WizardStepId {
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
