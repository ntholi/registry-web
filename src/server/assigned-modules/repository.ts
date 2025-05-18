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

  async removeModuleAssignments(userId: string, semesterModuleIds: number[]) {
    if (semesterModuleIds.length === 0) return;
    
    return db.delete(assignedModules)
      .where(
        and(
          eq(assignedModules.userId, userId),
          inArray(assignedModules.semesterModuleId, semesterModuleIds)
        )
      );
  }

  async createMany(data: typeof assignedModules.$inferInsert[]) {
    if (data.length === 0) return [];
    
    return db.insert(assignedModules)
      .values(data)
      .returning();
  }

  async findByUserAndModule(userId: string, semesterModuleId: number) {
    return db.query.assignedModules.findFirst({
      where: and(
        eq(assignedModules.userId, userId),
        eq(assignedModules.semesterModuleId, semesterModuleId)
      )
    });
  }

  async findByModule(semesterModuleId: number) {
    return db.query.assignedModules.findMany({
      where: eq(assignedModules.semesterModuleId, semesterModuleId)
    });
  }

  async findByUser(userId: string) {
    return db.query.assignedModules.findMany({
      where: eq(assignedModules.userId, userId)
    });
  }
}

export const assignedModulesRepository = new AssignedModuleRepository();