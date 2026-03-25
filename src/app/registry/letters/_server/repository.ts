import { and, desc, eq, isNull, or, sql } from 'drizzle-orm';
import type { DashboardRole } from '@/core/auth/permissions';
import {
	auditLogs,
	db,
	letterRecipients,
	letters,
	letterTemplates,
	users,
} from '@/core/database';
import BaseRepository, {
	type AuditOptions,
} from '@/core/platform/BaseRepository';

export default class LetterTemplateRepository extends BaseRepository<
	typeof letterTemplates,
	'id'
> {
	constructor() {
		super(letterTemplates, letterTemplates.id);
	}

	async findAllActive(role?: DashboardRole) {
		return db.query.letterTemplates.findMany({
			where: and(
				eq(letterTemplates.isActive, true),
				role
					? or(eq(letterTemplates.role, role), isNull(letterTemplates.role))
					: undefined
			),
			orderBy: letterTemplates.name,
		});
	}
}

export class LetterRepository extends BaseRepository<typeof letters, 'id'> {
	constructor() {
		super(letters, letters.id);
	}

	async getWithRelations(id: string) {
		return db.query.letters.findFirst({
			where: eq(letters.id, id),
			with: {
				template: {
					columns: {
						id: true,
						name: true,
						signOffName: true,
						signOffTitle: true,
					},
				},
				student: {
					columns: {
						stdNo: true,
						name: true,
					},
				},
				creator: { columns: { name: true } },
				recipient: true,
			},
		});
	}

	async findByStudent(stdNo: number, page: number, search: string) {
		return this.query({
			page,
			search,
			searchColumns: ['serialNumber'],
			filter: eq(letters.stdNo, stdNo),
			sort: [{ column: 'createdAt', order: 'desc' }],
		});
	}

	async generate(
		data: {
			templateId: string;
			stdNo: number;
			content: string;
			subject?: string | null;
			salutation: string;
			recipientId?: string | null;
			statusId?: string | null;
			createdBy: string;
		},
		audit?: AuditOptions
	) {
		return db.transaction(async (tx) => {
			const [letter] = await tx.insert(letters).values(data).returning();

			if (audit && this.auditEnabled) {
				await this.writeAuditLog(tx, 'INSERT', letter.id, null, letter, audit);
			}

			return letter;
		});
	}

	async getStudentForLetter(stdNo: number) {
		return db.query.students.findFirst({
			where: (s, { eq }) => eq(s.stdNo, stdNo),
			columns: {
				stdNo: true,
				name: true,
				nationalId: true,
				gender: true,
				dateOfBirth: true,
				nationality: true,
			},
			with: {
				programs: {
					where: (p, { eq }) => eq(p.status, 'Active'),
					limit: 1,
					with: {
						structure: {
							with: {
								program: {
									with: { school: { columns: { name: true } } },
									columns: { name: true },
								},
							},
						},
						semesters: {
							orderBy: (s, { desc }) => desc(s.createdAt),
							limit: 1,
							with: {
								structureSemester: {
									columns: { semesterNumber: true },
								},
							},
							columns: { termCode: true },
						},
					},
				},
			},
		});
	}

	async logPrint(id: string, audit: AuditOptions) {
		await db.transaction(async (tx) => {
			await this.writeAuditLog(
				tx,
				'INSERT',
				id,
				null,
				{ id, action: 'print' },
				audit
			);
		});
	}

	async findPrintHistory(id: string) {
		return db
			.select({
				id: sql<string>`${auditLogs.id}::text`,
				changedAt: auditLogs.changedAt,
				changedByName: users.name,
			})
			.from(auditLogs)
			.innerJoin(users, eq(auditLogs.changedBy, users.id))
			.where(
				and(
					eq(auditLogs.tableName, 'letters'),
					eq(auditLogs.activityType, 'letter_printed'),
					eq(auditLogs.recordId, id)
				)
			)
			.orderBy(desc(auditLogs.changedAt));
	}

	async findByTemplate(templateId: string, page: number, search: string) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;

		const where = and(
			eq(letters.templateId, templateId),
			search
				? sql`EXISTS (SELECT 1 FROM students s WHERE s.std_no = ${letters.stdNo} AND s.name ILIKE ${`%${search}%`})`
				: undefined
		);

		const [items, countResult] = await Promise.all([
			db.query.letters.findMany({
				where,
				orderBy: desc(letters.createdAt),
				limit: pageSize,
				offset,
				with: {
					student: { columns: { name: true, stdNo: true } },
				},
			}),
			db.select({ count: sql<number>`count(*)` }).from(letters).where(where),
		]);

		const total = Number(countResult[0]?.count ?? 0);
		return {
			items,
			totalPages: Math.ceil(total / pageSize),
			totalItems: total,
		};
	}

	async findWithRelations(page: number, search: string) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;

		const where = search
			? or(
					sql`${letters.serialNumber} ILIKE ${`%${search}%`}`,
					sql`EXISTS (SELECT 1 FROM students s WHERE s.std_no = ${letters.stdNo} AND s.name ILIKE ${`%${search}%`})`
				)
			: undefined;

		const [items, countResult] = await Promise.all([
			db.query.letters.findMany({
				where,
				orderBy: desc(letters.createdAt),
				limit: pageSize,
				offset,
				with: {
					student: { columns: { name: true, stdNo: true } },
					template: { columns: { name: true } },
					creator: { columns: { name: true } },
				},
			}),
			db.select({ count: sql<number>`count(*)` }).from(letters).where(where),
		]);

		const total = Number(countResult[0]?.count ?? 0);
		return {
			items,
			totalPages: Math.ceil(total / pageSize),
			totalItems: total,
		};
	}
}

export class LetterRecipientRepository extends BaseRepository<
	typeof letterRecipients,
	'id'
> {
	constructor() {
		super(letterRecipients, letterRecipients.id);
		this.auditEnabled = false;
	}

	async findByTemplate(templateId: string) {
		return db.query.letterRecipients.findMany({
			where: eq(letterRecipients.templateId, templateId),
			orderBy: desc(letterRecipients.popularity),
		});
	}

	async incrementPopularity(id: string) {
		await db
			.update(letterRecipients)
			.set({ popularity: sql`${letterRecipients.popularity} + 1` })
			.where(eq(letterRecipients.id, id));
	}
}
