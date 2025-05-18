import BaseRepository from '@/server/base/BaseRepository';
import { assignedModules } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';

export default class AssignedModuleRepository extends BaseRepository<
  typeof assignedModules,
  'id'
> {
  constructor() {
    super(assignedModules, 'id');
  }

  async removeModuleAssignments(semesterModuleIds: number[]) {
    if (semesterModuleIds.length === 0) return;
    
    return db.delete(assignedModules)
      .where(inArray(assignedModules.semesterModuleId, semesterModuleIds));
  }

  async createMany(data: typeof assignedModules.$inferInsert[]) {
    if (data.length === 0) return [];
    
    return db.insert(assignedModules)
      .values(data)
      .returning();
  }
}

export const assignedModulesRepository = new AssignedModuleRepository();