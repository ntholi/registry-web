import { pgEnum } from 'drizzle-orm/pg-core';

export const gradingTypeEnum = pgEnum('grading_type', [
	'subject-grades',
	'classification',
]);
export type GradingType = (typeof gradingTypeEnum.enumValues)[number];

export const standardGradeEnum = pgEnum('standard_grade', [
	'A*',
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'U',
]);
export type StandardGrade = (typeof standardGradeEnum.enumValues)[number];

export const resultClassificationEnum = pgEnum('result_classification', [
	'Distinction',
	'Merit',
	'Credit',
	'Pass',
	'Fail',
]);
export type ResultClassification =
	(typeof resultClassificationEnum.enumValues)[number];

export const documentCategoryEnum = pgEnum('document_category', [
	'certificate',
	'identity',
	'proof_of_payment',
]);
export type DocumentCategory = (typeof documentCategoryEnum.enumValues)[number];

export const documentVerificationStatusEnum = pgEnum(
	'document_verification_status',
	['pending', 'verified', 'rejected']
);
export type DocumentVerificationStatus =
	(typeof documentVerificationStatusEnum.enumValues)[number];

export const applicationStatusEnum = pgEnum('application_status', [
	'draft',
	'submitted',
	'under_review',
	'accepted_first_choice',
	'accepted_second_choice',
	'rejected',
	'waitlisted',
]);
export type ApplicationStatus =
	(typeof applicationStatusEnum.enumValues)[number];

export const paymentStatusEnum = pgEnum('payment_status', ['unpaid', 'paid']);
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
