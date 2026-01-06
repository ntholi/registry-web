import { pgEnum } from 'drizzle-orm/pg-core';

export const programLevelEnum = pgEnum('program_level', [
	'certificate',
	'diploma',
	'degree',
]);
export type ProgramLevel = (typeof programLevelEnum.enumValues)[number];

export const moduleStatusEnum = pgEnum('module_status', ['Active', 'Defunct']);

export const moduleType = pgEnum('module_type', [
	'Major',
	'Minor',
	'Core',
	'Delete',
	'Elective',
]);
export type ModuleType = (typeof moduleType.enumValues)[number];

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

export type AssessmentNumber = (typeof assessmentNumber.enumValues)[number];

export const assessmentMarksAuditAction = pgEnum(
	'assessment_marks_audit_action',
	['create', 'update', 'delete']
);

export const assessmentsAuditAction = pgEnum('assessments_audit_action', [
	'create',
	'update',
	'delete',
]);
