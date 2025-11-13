import { pgEnum } from 'drizzle-orm/pg-core';

export const dashboardUsers = pgEnum('dashboard_users', [
	'finance',
	'registry',
	'library',
	'resource',
	'academic',
	'student_services',
	'admin',
]);
export type DashboardUser = (typeof dashboardUsers.enumValues)[number];

export const userRoles = pgEnum('user_roles', [
	'user',
	'student',
	'finance',
	'registry',
	'library',
	'resource',
	'academic',
	'student_services',
	'admin',
]);
export type UserRole = (typeof userRoles.enumValues)[number];

export const userPositions = pgEnum('user_positions', [
	'manager',
	'program_leader',
	'principal_lecturer',
	'year_leader',
	'lecturer',
	'admin',
]);
export type UserPosition = (typeof userPositions.enumValues)[number];

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

export const grade = pgEnum('grade', [
	'A+',
	'A',
	'A-',
	'B+',
	'B',
	'B-',
	'C+',
	'C',
	'C-',
	'F',
	'PC',
	'PX',
	'AP',
	'X',
	'DEF',
	'GNS',
	'ANN',
	'FIN',
	'FX',
	'DNC',
	'DNA',
	'PP',
	'DNS',
	'EXP',
	'NM',
]);
export type Grade = (typeof grade.enumValues)[number];

export const programLevelEnum = pgEnum('program_level', [
	'certificate',
	'diploma',
	'degree',
]);

export const moduleStatusEnum = pgEnum('module_status', ['Active', 'Defunct']);

export const moduleType = pgEnum('module_type', [
	'Major',
	'Minor',
	'Core',
	'Delete',
	'Elective',
]);
export type ModuleType = (typeof moduleType.enumValues)[number];

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

export const paymentType = pgEnum('payment_type', [
	'graduation_gown',
	'graduation_fee',
]);

export const assessmentNumber = pgEnum('assessment_number', [
	'CW1',
	'CW2',
	'CW3',
	'CW4',
	'CW5',
	'CW6',
	'CW7',
	'CW8',
	'CW9',
	'CW10',
	'CW11',
	'CW12',
	'CW13',
	'CW14',
	'CW15',
]);

export const assessmentMarksAuditAction = pgEnum(
	'assessment_marks_audit_action',
	['create', 'update', 'delete']
);

export const assessmentsAuditAction = pgEnum('assessments_audit_action', [
	'create',
	'update',
	'delete',
]);

export const blockedStudentStatusEnum = pgEnum('blocked_student_status', [
	'blocked',
	'unblocked',
]);

export const fortinetLevel = pgEnum('fortinet_level', [
	'nse1',
	'nse2',
	'nse3',
	'nse4',
	'nse5',
	'nse6',
	'nse7',
	'nse8',
]);

export const fortinetRegistrationStatus = pgEnum(
	'fortinet_registration_status',
	['pending', 'approved', 'rejected', 'completed']
);

export const taskStatus = pgEnum('task_status', [
	'scheduled',
	'active',
	'in_progress',
	'completed',
	'cancelled',
]);
export type TaskStatus = (typeof taskStatus.enumValues)[number];

export const taskPriority = pgEnum('task_priority', [
	'low',
	'medium',
	'high',
	'urgent',
]);
export type TaskPriority = (typeof taskPriority.enumValues)[number];
