import type {
	modules,
	programs,
	schools,
	structures,
	terms,
} from './academic-structure';
import type { assessmentMarks, assessments, moduleGrades } from './assessments';
import type { accounts, users } from './auth';
import type {
	nextOfKins,
	studentEducation,
	studentPrograms,
	students,
} from './students';

export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;

export type Student = typeof students.$inferSelect;
export type StudentEducation = typeof studentEducation.$inferSelect;
export type NextOfKin = typeof nextOfKins.$inferSelect;
export type StudentProgram = typeof studentPrograms.$inferSelect;

export type School = typeof schools.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type Structure = typeof structures.$inferSelect;
export type Term = typeof terms.$inferSelect;
export type Module = typeof modules.$inferSelect;

export type Assessment = typeof assessments.$inferSelect;
export type AssessmentMark = typeof assessmentMarks.$inferSelect;
export type ModuleGrade = typeof moduleGrades.$inferSelect;
