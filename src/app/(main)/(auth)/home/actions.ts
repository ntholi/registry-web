'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import {
  registrationRequests,
  structureSemesters,
  studentPrograms,
  studentSemesters,
} from '@/db/schema';
import { and, eq, notInArray } from 'drizzle-orm';

const grades = {
  'A+': 4.0,
  A: 4.0,
  'A-': 4.0,
  'B+': 3.67,
  B: 3.33,
  'B-': 3.0,
  'C+': 2.67,
  C: 2.33,
  'C-': 2.0,
  F: 0.0,
  PC: 2.0,
  PX: 2.0,
  AP: 2.0,
  X: 0.0,
  GNS: 0.0,
  ANN: 0.0,
  FIN: 0.0,
  FX: 0.0,
  DNC: 0.0,
  DNA: 0.0,
  PP: 0.0,
  DNS: 0.0,
};

const gradeValues = Object.keys(grades) as Array<keyof typeof grades>;

function isValidGrade(grade: string): grade is keyof typeof grades {
  return gradeValues.includes(grade as keyof typeof grades);
}

function getPoints(grade: keyof typeof grades): number {
  const points = grades[grade];
  if (points) return points;

  return 0;
}

export async function getStudentScore(stdNo: number, structureId: number) {
  const program = await db.query.studentPrograms.findFirst({
    where: and(
      eq(studentPrograms.stdNo, stdNo),
      eq(studentPrograms.status, 'Active')
    ),
    with: {
      semesters: {
        where: notInArray(studentSemesters.status, [
          'Deleted',
          'DroppedOut',
          'Deferred',
          'Inactive',
        ]),
        with: {
          studentModules: {
            with: {
              module: true,
            },
          },
        },
      },
    },
  });

  if (!program?.semesters.length) {
    return {
      gpa: 0,
      creditsCompleted: 0,
      creditsRequired: 0,
    };
  }

  const modules = program.semesters.flatMap(
    (semester) => semester.studentModules
  );
  let totalPoints = 0;
  let totalCredits = 0;
  let creditsCompleted = 0;

  modules.forEach((stdModule) => {
    if (isValidGrade(stdModule.grade)) {
      const points = getPoints(stdModule.grade);
      if (points > 0) {
        totalPoints += points * stdModule.module.credits;
        totalCredits += stdModule.module.credits;
        creditsCompleted += stdModule.module.credits;
      }
    }
  });

  const semesters = await db.query.structureSemesters.findMany({
    where: eq(structureSemesters.structureId, structureId),
    with: {
      semesterModules: {
        with: {
          module: true,
        },
      },
    },
  });

  const creditsRequired = semesters
    .flatMap((it) => it.semesterModules)
    .flatMap((it) => it.module)
    .reduce((sum, it) => sum + it.credits, 0);

  return {
    gpa: totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0,
    creditsCompleted,
    creditsRequired,
  };
}

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'registration' | 'academic' | 'finance' | 'general';
  status: 'pending' | 'approved' | 'rejected' | 'info';
  timestamp: Date;
  href: string;
};

export async function getNotifications(): Promise<Notification[]> {
  const session = await auth();
  if (!session?.user?.stdNo) return [];

  const regRequests = await db.query.registrationRequests.findMany({
    where: eq(registrationRequests.stdNo, session.user.stdNo),
    orderBy: (requests) => requests.createdAt,
    limit: 5,
  });

  return regRequests.map((req) => ({
    id: req.id.toString(),
    title: 'Registration Status',
    message: `${
      req.message || statusFromRequest(req.status)
    } Click to view details`,
    type: 'registration',
    status: req.status,
    timestamp: req.createdAt ?? new Date(),
    href: `/registration/status`,
  }));
}

function statusFromRequest(status: 'pending' | 'approved' | 'rejected') {
  switch (status) {
    case 'pending':
      return 'Your registration request is currently under review.';
    case 'rejected':
      return 'Your registration request has been rejected';
    case 'approved':
      return 'Your registration request has been approved';
  }
}
