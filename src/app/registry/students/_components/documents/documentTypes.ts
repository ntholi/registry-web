import type { DocumentType } from '@registry/documents/_schema/documents';

const documentTypes: { value: DocumentType; label: string }[] = [
	{ value: 'identity', label: 'Identity Document' },
	{ value: 'certificate', label: 'Certificate' },
	{ value: 'academic_record', label: 'Academic Record' },
	{ value: 'proof_of_payment', label: 'Proof of Payment' },
	{ value: 'passport_photo', label: 'Passport Photo' },
	{ value: 'recommendation_letter', label: 'Recommendation Letter' },
	{ value: 'personal_statement', label: 'Personal Statement' },
	{ value: 'medical_report', label: 'Medical Report' },
	{ value: 'enrollment_letter', label: 'Enrollment Letter' },
	{ value: 'clearance_form', label: 'Clearance Form' },
	{ value: 'other', label: 'Other' },
];

export default documentTypes;
