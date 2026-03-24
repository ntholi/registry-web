import { and, desc, eq, or, sql } from 'drizzle-orm';
import type { DashboardRole } from '@/core/auth/permissions';
import { db, letters, letterTemplates } from '@/core/database';
import BaseRepository, {
	type AuditOptions,
	type TransactionClient,
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
				role ? eq(letterTemplates.role, role) : undefined
			),
			orderBy: letterTemplates.name,
		});
	}
}

export class LetterRepository extends BaseRepository<typeof letters, 'id'> {
	constructor() {
		super(letters, letters.id);
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

	async generateSerial(tx: TransactionClient) {
		const result = await tx.execute<{ serial: string }>(
			sql`SELECT generate_letter_serial() AS serial`
		);
		return result.rows[0].serial;
	}

	async generate(
		data: {
			templateId: string;
			stdNo: number;
			content: string;
			statusId?: string | null;
			createdBy: string;
		},
		audit?: AuditOptions
	) {
		return db.transaction(async (tx) => {
			const serial = await this.generateSerial(tx);
			const [letter] = await tx
				.insert(letters)
				.values({ ...data, serialNumber: serial })
				.returning();

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
