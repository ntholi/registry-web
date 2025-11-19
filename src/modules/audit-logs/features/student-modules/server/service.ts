import { eq } from 'drizzle-orm';
import type { Session } from 'next-auth';
import { auth } from '@/core/auth';
import { db, studentModuleAuditLogs, studentModules } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import StudentModuleAuditLogRepository from './repository';

type StudentModuleUpdate = Partial<typeof studentModules.$inferInsert>;

class StudentModuleAuditLogService extends BaseService<
	typeof studentModuleAuditLogs,
	'id'
> {
	constructor() {
		super(new StudentModuleAuditLogRepository(), {
			byIdRoles: ['registry', 'admin'],
			findAllRoles: ['registry', 'admin'],
			createRoles: ['registry', 'admin'],
		});
	}

	async updateStudentModule(
		studentModuleId: number,
		updates: StudentModuleUpdate,
		reasons?: string
	) {
		return withAuth(
			async () => {
				const session = await auth();
				if (!session?.user?.id) {
					throw new Error('User not authenticated');
				}

				const oldRecord = await db.query.studentModules.findFirst({
					where: eq(studentModules.id, studentModuleId),
				});

				if (!oldRecord) {
					throw new Error('Student module not found');
				}

				const [updatedRecord] = await db
					.update(studentModules)
					.set(updates)
					.where(eq(studentModules.id, studentModuleId))
					.returning();

				await db.insert(studentModuleAuditLogs).values({
					studentModuleId,
					oldValues: oldRecord as unknown as Record<string, unknown>,
					newValues: updatedRecord as unknown as Record<string, unknown>,
					reasons: reasons || null,
					updatedBy: session.user.id,
				});

				return updatedRecord;
			},
			async (session: Session) => {
				if (!session?.user) {
					return false;
				}
				const isAdmin = session.user.role === 'admin';
				const isRegistryManager =
					session.user.role === 'registry' &&
					session.user.position === 'manager';
				return isAdmin || isRegistryManager;
			}
		);
	}
}

export const studentModuleAuditLogService = serviceWrapper(
	StudentModuleAuditLogService,
	'StudentModuleAuditLogService'
);
