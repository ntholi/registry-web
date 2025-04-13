'use server';

import { lecturesModulesService as service } from './service';
import { LecturesModule } from './types';
import { db } from '@/db';
import { lecturerModules } from '@/db/schema';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';

export async function getLecturesModule(id: number) {
  return service.get(id);
}

export async function getLecturesModules(page: number = 1, search = '') {
  return service.getAll({ page, search });
}

export async function createLecturesModule(lecturesModule: LecturesModule) {
  return service.create(lecturesModule.moduleId);
}

export async function deleteLecturesModule(id: number) {
  return service.delete(id);
}

export async function getLecturerModulesForUser() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const modules = await db.query.lecturerModules.findMany({
    where: eq(lecturerModules.userId, session.user.id),
    with: {
      semesterModule: {
        with: {
          module: true,
        },
      },
    },
  });

  return modules;
}
