import { semesterModules } from '@academic/semester-modules/_schema/semesterModules';
import { sponsoredStudents } from '@finance/sponsors/_schema/sponsoredStudents';
import { registrationClearance } from '@registry/clearance/_schema/registrationClearance';
import { studentSemesters } from '@registry/students/_schema/studentSemesters';
import { students } from '@registry/students/_schema/students';
import { terms } from '@registry/terms/_schema/terms';
import { relations } from 'drizzle-orm';
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
