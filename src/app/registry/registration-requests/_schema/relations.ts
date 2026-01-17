import { relations } from 'drizzle-orm';
import {
	registrationClearance,
	semesterModules,
	sponsoredStudents,
	studentSemesters,
	students,
	terms,
} from '@/core/database';
import { registrationRequests } from './registrationRequests';
import { requestedModules } from './requestedModules';

export const registrationRequestsRelations = relations(
	registrationRequests,
	({ many, one }) => ({
		student: one(students, {
			fields: [registrationRequests.stdNo],
			references: [students.stdNo],
		}),
		term: one(terms, {
			fields: [registrationRequests.termId],
			references: [terms.id],
		}),
		sponsoredStudent: one(sponsoredStudents, {
			fields: [registrationRequests.sponsoredStudentId],
			references: [sponsoredStudents.id],
		}),
		clearances: many(registrationClearance),
		requestedModules: many(requestedModules),
		studentSemester: one(studentSemesters, {
			fields: [registrationRequests.id],
			references: [studentSemesters.registrationRequestId],
		}),
	})
);

export const requestedModulesRelations = relations(
	requestedModules,
	({ one }) => ({
		registrationRequest: one(registrationRequests, {
			fields: [requestedModules.registrationRequestId],
			references: [registrationRequests.id],
		}),
		semesterModule: one(semesterModules, {
			fields: [requestedModules.semesterModuleId],
			references: [semesterModules.id],
		}),
	})
);
