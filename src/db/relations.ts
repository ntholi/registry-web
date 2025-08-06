import { relations } from 'drizzle-orm';
import {
  accounts,
  assessments,
  assessmentsAudit,
  assessmentMarks,
  assessmentMarksAudit,
  authenticators,
  assignedModules,
  modulePrerequisites,
  semesterModules,
  programs,
  registrationClearanceAudit,
  registrationClearances,
  registrationRequests,
  requestedModules,
  schools,
  sessions,
  signups,
  sponsoredStudents,
  sponsoredTerms,
  sponsors,
  structureSemesters,
  structures,
  studentModules,
  studentPrograms,
  studentSemesters,
  students,
  terms,
  users,
  userSchools,
  modules,
  blockedStudents,
} from './schema';

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  authenticators: many(authenticators),
  signup: one(signups, {
    fields: [users.id],
    references: [signups.userId],
  }),
  student: one(students, {
    fields: [users.id],
    references: [students.userId],
  }),
  userSchools: many(userSchools),
}));

export const signupsRelations = relations(signups, ({ one }) => ({
  user: one(users, {
    fields: [signups.userId],
    references: [users.id],
  }),
}));

export const studentsRelations = relations(students, ({ many, one }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  programs: many(studentPrograms),
  registrationRequests: many(registrationRequests),
  sponsorships: many(sponsoredStudents),
}));

export const studentProgramsRelations = relations(
  studentPrograms,
  ({ many, one }) => ({
    student: one(students, {
      fields: [studentPrograms.stdNo],
      references: [students.stdNo],
    }),
    structure: one(structures, {
      fields: [studentPrograms.structureId],
      references: [structures.id],
    }),
    semesters: many(studentSemesters),
  })
);

export const studentSemestersRelations = relations(
  studentSemesters,
  ({ many, one }) => ({
    studentProgram: one(studentPrograms, {
      fields: [studentSemesters.studentProgramId],
      references: [studentPrograms.id],
    }),
    studentModules: many(studentModules),
  })
);

export const studentModulesRelations = relations(studentModules, ({ one }) => ({
  studentSemester: one(studentSemesters, {
    fields: [studentModules.studentSemesterId],
    references: [studentSemesters.id],
  }),
  semesterModule: one(semesterModules, {
    fields: [studentModules.semesterModuleId],
    references: [semesterModules.id],
  }),
}));

export const schoolsRelations = relations(schools, ({ many }) => ({
  programs: many(programs),
  userSchools: many(userSchools),
}));

export const programsRelations = relations(programs, ({ many, one }) => ({
  school: one(schools, {
    fields: [programs.schoolId],
    references: [schools.id],
  }),
  structures: many(structures),
}));

export const structuresRelations = relations(structures, ({ many, one }) => ({
  program: one(programs, {
    fields: [structures.programId],
    references: [programs.id],
  }),
  semesters: many(structureSemesters),
  students: many(students),
  studentPrograms: many(studentPrograms),
}));

export const structureSemestersRelations = relations(
  structureSemesters,
  ({ many, one }) => ({
    structure: one(structures, {
      fields: [structureSemesters.structureId],
      references: [structures.id],
    }),
    semesterModules: many(semesterModules),
  })
);

export const semesterModulesRelations = relations(
  semesterModules,
  ({ many, one }) => ({
    semesters: many(semesterModules),
    prerequisites: many(modulePrerequisites, {
      relationName: 'semesterModulePrerequisites',
    }),
    prerequisiteFor: many(modulePrerequisites, {
      relationName: 'prerequisiteModules',
    }),
    requestedModules: many(requestedModules),
    semester: one(structureSemesters, {
      fields: [semesterModules.semesterId],
      references: [structureSemesters.id],
    }),
    studentModules: many(studentModules),
    module: one(modules, {
      fields: [semesterModules.moduleId],
      references: [modules.id],
    }),
  })
);

export const modulesRelations = relations(modules, ({ one, many }) => ({
  semesterModule: one(semesterModules, {
    fields: [modules.id],
    references: [semesterModules.moduleId],
  }),
  assessments: many(assessments),
}));

export const modulePrerequisitesRelations = relations(
  modulePrerequisites,
  ({ one }) => ({
    semesterModule: one(semesterModules, {
      fields: [modulePrerequisites.semesterModuleId],
      references: [semesterModules.id],
      relationName: 'semesterModulePrerequisites',
    }),
    prerequisite: one(semesterModules, {
      fields: [modulePrerequisites.prerequisiteId],
      references: [semesterModules.id],
      relationName: 'prerequisiteModules',
    }),
  })
);

export const termsRelations = relations(terms, ({ many }) => ({
  registrationRequests: many(registrationRequests),
  sponsoredTerms: many(sponsoredTerms),
}));

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
    sponsor: one(sponsors, {
      fields: [registrationRequests.sponsorId],
      references: [sponsors.id],
    }),
    clearances: many(registrationClearances),
    requestedModules: many(requestedModules),
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

export const registrationClearanceRelations = relations(
  registrationClearances,
  ({ one, many }) => ({
    registrationRequest: one(registrationRequests, {
      fields: [registrationClearances.registrationRequestId],
      references: [registrationRequests.id],
    }),
    respondedBy: one(users, {
      fields: [registrationClearances.respondedBy],
      references: [users.id],
    }),
    audits: many(registrationClearanceAudit),
  })
);

export const registrationClearanceAuditRelations = relations(
  registrationClearanceAudit,
  ({ one }) => ({
    registrationClearance: one(registrationClearances, {
      fields: [registrationClearanceAudit.registrationClearanceId],
      references: [registrationClearances.id],
    }),
    user: one(users, {
      fields: [registrationClearanceAudit.createdBy],
      references: [users.id],
    }),
  })
);

export const sponsorsRelations = relations(sponsors, ({ many }) => ({
  registrationRequests: many(registrationRequests),
  sponsoredStudents: many(sponsoredStudents),
}));

export const sponsoredStudentsRelations = relations(
  sponsoredStudents,
  ({ one, many }) => ({
    sponsor: one(sponsors, {
      fields: [sponsoredStudents.sponsorId],
      references: [sponsors.id],
    }),
    student: one(students, {
      fields: [sponsoredStudents.stdNo],
      references: [students.stdNo],
    }),
    sponsoredTerms: many(sponsoredTerms),
  })
);

export const sponsoredTermsRelations = relations(sponsoredTerms, ({ one }) => ({
  sponsoredStudent: one(sponsoredStudents, {
    fields: [sponsoredTerms.sponsoredStudentId],
    references: [sponsoredStudents.id],
  }),
  term: one(terms, {
    fields: [sponsoredTerms.termId],
    references: [terms.id],
  }),
}));

export const assignedModulesRelations = relations(
  assignedModules,
  ({ one }) => ({
    user: one(users, {
      fields: [assignedModules.userId],
      references: [users.id],
    }),
    semesterModule: one(semesterModules, {
      fields: [assignedModules.semesterModuleId],
      references: [semesterModules.id],
    }),
  })
);

export const assessmentsRelations = relations(assessments, ({ many, one }) => ({
  module: one(modules, {
    fields: [assessments.moduleId],
    references: [modules.id],
  }),
  term: one(terms, {
    fields: [assessments.termId],
    references: [terms.id],
  }),
  marks: many(assessmentMarks),
  audits: many(assessmentsAudit),
}));

export const assessmentMarksRelations = relations(
  assessmentMarks,
  ({ one, many }) => ({
    assessment: one(assessments, {
      fields: [assessmentMarks.assessmentId],
      references: [assessments.id],
    }),
    student: one(students, {
      fields: [assessmentMarks.stdNo],
      references: [students.stdNo],
    }),
    audits: many(assessmentMarksAudit),
  })
);

export const assessmentMarksAuditRelations = relations(
  assessmentMarksAudit,
  ({ one }) => ({
    assessmentMark: one(assessmentMarks, {
      fields: [assessmentMarksAudit.assessmentMarkId],
      references: [assessmentMarks.id],
    }),
    createdByUser: one(users, {
      fields: [assessmentMarksAudit.createdBy],
      references: [users.id],
    }),
  })
);

export const assessmentsAuditRelations = relations(
  assessmentsAudit,
  ({ one }) => ({
    assessment: one(assessments, {
      fields: [assessmentsAudit.assessmentId],
      references: [assessments.id],
    }),
    createdByUser: one(users, {
      fields: [assessmentsAudit.createdBy],
      references: [users.id],
    }),
  })
);

export const userSchoolsRelations = relations(userSchools, ({ one }) => ({
  user: one(users, {
    fields: [userSchools.userId],
    references: [users.id],
  }),
  school: one(schools, {
    fields: [userSchools.schoolId],
    references: [schools.id],
  }),
}));

export const blockedStudentsRelations = relations(
  blockedStudents,
  ({ one }) => ({
    student: one(students, {
      fields: [blockedStudents.stdNo],
      references: [students.stdNo],
    }),
  })
);
