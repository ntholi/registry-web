import { and, desc, eq } from 'drizzle-orm';
import { db, employees, users } from '@/core/database';
import { auditLogs } from '@/core/database/schema/auditLogs';
import BaseRepository, {
	type AuditOptions,
} from '@/core/platform/BaseRepository';

export default class EmployeeRepository extends BaseRepository<
	typeof employees,
	'empNo'
> {
	constructor() {
		super(employees, employees.empNo);
	}

	async findByEmpNo(empNo: string) {
		return db.query.employees.findFirst({
			where: eq(employees.empNo, empNo),
			with: {
				user: true,
				school: true,
			},
		});
	}

	async logCardPrint(empNo: string, audit: AuditOptions) {
		await db.transaction(async (tx) => {
			await this.writeAuditLog(
				tx,
				'INSERT',
				empNo,
				null,
				{ empNo, action: 'card_print' },
				audit
			);
		});
	}

	async findCardPrintHistory(empNo: string) {
		return db
			.select({
				id: auditLogs.id,
				changedAt: auditLogs.changedAt,
				changedByName: users.name,
			})
			.from(auditLogs)
			.innerJoin(users, eq(auditLogs.changedBy, users.id))
			.where(
				and(
					eq(auditLogs.tableName, 'employees'),
					eq(auditLogs.activityType, 'employee_card_print'),
					eq(auditLogs.recordId, empNo)
				)
			)
			.orderBy(desc(auditLogs.changedAt));
	}
}
