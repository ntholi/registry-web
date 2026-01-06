import { pgEnum } from 'drizzle-orm/pg-core';

export const gender = pgEnum('gender', ['Male', 'Female', 'Unknown']);

export const maritalStatusEnum = pgEnum('marital_status', [
	'Single',
	'Married',
	'Divorced',
	'Windowed',
	'Other',
]);

export const studentStatus = pgEnum('student_status', [
	'Active',
	'Applied',
	'Deceased',
	'Deleted',
	'Graduated',
	'Suspended',
	'Terminated',
	'Withdrawn',
]);

export const educationType = pgEnum('education_type', [
	'Primary',
	'Secondary',
	'Tertiary',
]);

export const educationLevel = pgEnum('education_level', [
	'JCE',
	'BJCE',
	'BGGSE',
	'BGCSE',
	'LGCSE',
	'IGCSE',
	'O-Levels',
	'A-Levels',
	'Matriculation',
	'Cambridge Oversea School Certificate',
	'Certificate',
	'Diploma',
	'Degree',
	'Masters',
	'Doctorate',
	'Others',
]);

export const nextOfKinRelationship = pgEnum('next_of_kin_relationship', [
	'Mother',
	'Father',
	'Brother',
	'Sister',
	'Child',
	'Spouse',
	'Guardian',
	'Husband',
	'Wife',
	'Permanent',
	'Self',
	'Other',
]);

export const programStatus = pgEnum('program_status', [
	'Active',
	'Changed',
	'Completed',
	'Deleted',
	'Inactive',
]);
export type StudentProgramStatus = (typeof programStatus.enumValues)[number];

export const semesterStatus = pgEnum('semester_status', [
	'Active',
	'Outstanding',
	'Deferred',
	'Deleted',
	'DNR',
	'DroppedOut',
	'Withdrawn',
	'Enrolled',
	'Exempted',
	'Inactive',
	'Repeat',
]);
export type SemesterStatus = (typeof semesterStatus.enumValues)[number];

export const studentModuleStatus = pgEnum('student_module_status', [
	'Add',
	'Compulsory',
	'Delete',
	'Drop',
	'Exempted',
	'Ineligible',
	'Repeat1',
	'Repeat2',
	'Repeat3',
	'Repeat4',
	'Repeat5',
	'Repeat6',
	'Repeat7',
	'Resit1',
	'Resit2',
	'Resit3',
	'Resit4',
	'Supplementary',
]);
export type StudentModuleStatus =
	(typeof studentModuleStatus.enumValues)[number];

export const registrationRequestStatus = pgEnum('registration_request_status', [
	'pending',
	'approved',
	'rejected',
	'partial',
	'registered',
]);

export const semesterStatusForRegistration = pgEnum(
	'semester_status_for_registration',
	['Active', 'Repeat']
);

export const requestedModuleStatus = pgEnum('requested_module_status', [
	'pending',
	'registered',
	'rejected',
]);

export const clearanceRequestStatus = pgEnum('clearance_request_status', [
	'pending',
	'approved',
	'rejected',
]);

export const blockedStudentStatusEnum = pgEnum('blocked_student_status', [
	'blocked',
	'unblocked',
]);
