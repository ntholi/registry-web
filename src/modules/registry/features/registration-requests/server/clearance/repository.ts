import { and, asc, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { auth } from '@/core/auth';
import { db } from '@/core/database';
import {
	clearance,
	clearanceAudit,
	type DashboardUser,
	registrationClearance,
	registrationRequests,
	requestedModules,
	studentPrograms,
} from '@/core/database/schema';
import BaseRepository, {
	type QueryOptions,
} from '@/server/base/BaseRepository';

type Model = typeof clearance.$inferInsert;

export default class ClearanceRepository extends BaseRepository<
	typeof clearance,
	'id'
> {
	constructor() {
		super(clearance, clearance.id);
	}

	override async create(data: Model & { registrationRequestId: number }) {
		const session = await auth();

		const [inserted] = await db.transaction(async (tx) => {
			if (!session?.user?.id) throw new Error('Unauthorized');
			const [clearanceRecord] = await tx
				.insert(clearance)
				.values({
					department: data.department,
					status: data.status,
					message: data.message,
					emailSent: data.emailSent,
					respondedBy: data.respondedBy,
					responseDate: data.responseDate,
				})
				.returning();

			await tx.insert(registrationClearance).values({
				registrationRequestId: data.registrationRequestId,
				clearanceId: clearanceRecord.id,
			});

			const modulesList = await tx.query.requestedModules.findMany({
				where: eq(
					requestedModules.registrationRequestId,
					data.registrationRequestId
				),
				with: {
					semesterModule: {
						with: {
							module: true,
						},
					},
				},
			});

			await tx.insert(clearanceAudit).values({
				clearanceId: clearanceRecord.id,
				previousStatus: null,
				newStatus: clearanceRecord.status,
				createdBy: session.user.id,
				message: clearanceRecord.message,
				modules: modulesList.map((rm) => rm.semesterModule.module!.code),
			});

			return [clearanceRecord];
		});

		return inserted;
	}

	override async update(id: number, data: Partial<Model>) {
		const session = await auth();

		const [updated] = await db.transaction(async (tx) => {
			if (!session?.user?.id) throw new Error('Unauthorized');
			const current = await tx
				.select()
				.from(clearance)
				.where(eq(clearance.id, id))
				.limit(1)
				.then(([result]) => result);

			if (!current) throw new Error('Clearance not found');

			const [clearanceRecord] = await tx
				.update(clearance)
				.set(data)
				.where(eq(clearance.id, id))
				.returning();

			if (data.status && data.status !== current.status) {
				const regClearance = await tx.query.registrationClearance.findFirst({
					where: eq(registrationClearance.clearanceId, id),
				});

				if (regClearance) {
					const modulesList = await tx.query.requestedModules.findMany({
						where: eq(
							requestedModules.registrationRequestId,
							regClearance.registrationRequestId
						),
						with: {
							semesterModule: {
								with: {
									module: true,
								},
							},
						},
					});

					await tx.insert(clearanceAudit).values({
						clearanceId: id,
						previousStatus: current.status,
						newStatus: clearanceRecord.status,
						createdBy: session.user.id,
						message: data.message,
						modules: modulesList.map((rm) => rm.semesterModule.module!.code),
					});
				}
			}

			return [clearanceRecord];
		});

		return updated;
	}

	async findByIdWithRelations(id: number) {
		const rc = await db.query.registrationClearance.findFirst({
			where: eq(registrationClearance.clearanceId, id),
			with: {
				clearance: {
					with: {
						respondedBy: true,
					},
				},
				registrationRequest: {
					with: {
						student: true,
						term: true,
					},
				},
			},
		});

		if (!rc) return null;

		const [studentProgram, modules] = await Promise.all([
			db.query.studentPrograms.findFirst({
				where: and(
					eq(studentPrograms.stdNo, rc.registrationRequest.stdNo),
					eq(studentPrograms.status, 'Active')
				),
				orderBy: [asc(studentPrograms.id)],
				with: {
					structure: {
						with: {
							program: true,
						},
					},
				},
			}),
			db.query.requestedModules.findMany({
				where: eq(
					requestedModules.registrationRequestId,
					rc.registrationRequest.id
				),
				with: {
					semesterModule: {
						with: {
							module: true,
						},
					},
				},
			}),
		]);

		return {
			...rc.clearance,
			registrationRequest: {
				...rc.registrationRequest,
				student: {
					...rc.registrationRequest.student,
					programs: studentProgram ? [studentProgram] : [],
				},
				requestedModules: modules,
			},
		};
	}

	async findByDepartment(
		department: DashboardUser,
		params: QueryOptions<typeof clearance>,
		status?: 'pending' | 'approved' | 'rejected',
		termId?: number
	) {
		const { offset, limit } = this.buildQueryCriteria(params);

		const whereJoin = and(
			params.search
				? sql`${registrationRequests.stdNo}::text LIKE ${`%${params.search}%`}`
				: undefined,
			termId ? eq(registrationRequests.termId, termId) : undefined,
			eq(clearance.department, department),
			status ? eq(clearance.status, status) : undefined
		);

		const [{ total }] = await db
			.select({ total: count() })
			.from(registrationClearance)
			.innerJoin(
				registrationRequests,
				eq(registrationClearance.registrationRequestId, registrationRequests.id)
			)
			.innerJoin(clearance, eq(registrationClearance.clearanceId, clearance.id))
			.where(whereJoin);

		if (total === 0) {
			return { items: [], totalPages: 0, totalItems: 0 };
		}

		const idRows = await db
			.select({ id: registrationClearance.id })
			.from(registrationClearance)
			.innerJoin(
				registrationRequests,
				eq(registrationClearance.registrationRequestId, registrationRequests.id)
			)
			.innerJoin(clearance, eq(registrationClearance.clearanceId, clearance.id))
			.where(whereJoin)
			.orderBy(asc(clearance.createdAt))
			.limit(limit)
			.offset(offset);

		const ids = idRows.map((r) => r.id);
		if (ids.length === 0) {
			return { items: [], totalPages: 0, totalItems: 0 };
		}

		const rows = await db.query.registrationClearance.findMany({
			where: inArray(registrationClearance.id, ids),
			with: {
				clearance: true,
				registrationRequest: {
					with: {
						student: true,
					},
				},
			},
		});

		const formattedData = rows
			.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
			.map((rc) => ({
				...rc.clearance,
				registrationRequest: rc.registrationRequest,
			}));

		return {
			items: formattedData,
			totalItems: total,
			totalPages: Math.ceil(total / limit),
		};
	}

	async countByStatus(
		status: 'pending' | 'approved' | 'rejected',
		department: DashboardUser,
		termId?: number
	) {
		const whereJoin = and(
			eq(clearance.department, department),
			eq(clearance.status, status),
			termId ? eq(registrationRequests.termId, termId) : undefined
		);

		const [{ total }] = await db
			.select({ total: count() })
			.from(registrationClearance)
			.innerJoin(
				registrationRequests,
				eq(registrationClearance.registrationRequestId, registrationRequests.id)
			)
			.innerJoin(clearance, eq(registrationClearance.clearanceId, clearance.id))
			.where(whereJoin);

		return total;
	}

	async findHistory(clearanceId: number) {
		const rc = await db.query.registrationClearance.findFirst({
			where: eq(registrationClearance.clearanceId, clearanceId),
			with: {
				registrationRequest: {
					with: { term: true },
				},
				clearance: {
					with: {
						audits: {
							orderBy: desc(clearanceAudit.date),
							with: { user: true },
						},
					},
				},
			},
		});

		if (!rc) return [];

		return [
			{
				...rc.clearance,
				registrationRequest: rc.registrationRequest,
			},
		];
	}

	async findHistoryByStudentNo(stdNo: number, department: DashboardUser) {
		const idRows = await db
			.select({ id: registrationClearance.id })
			.from(registrationClearance)
			.innerJoin(
				registrationRequests,
				eq(registrationClearance.registrationRequestId, registrationRequests.id)
			)
			.innerJoin(clearance, eq(registrationClearance.clearanceId, clearance.id))
			.where(
				and(
					eq(registrationRequests.stdNo, stdNo),
					eq(clearance.department, department)
				)
			);

		const ids = idRows.map((r) => r.id);
		if (ids.length === 0) return [];

		const rows = await db.query.registrationClearance.findMany({
			where: inArray(registrationClearance.id, ids),
			with: {
				registrationRequest: { with: { term: true } },
				clearance: {
					with: {
						audits: {
							orderBy: desc(clearanceAudit.date),
							with: { user: true },
						},
					},
				},
			},
			orderBy: (rcs, { desc: d }) => [d(rcs.createdAt)],
		});

		return rows.map((rc) => ({
			...rc.clearance,
			registrationRequest: rc.registrationRequest,
		}));
	}

	async findNextPending(department: DashboardUser) {
		const nextRow = await db
			.select({ id: registrationClearance.id })
			.from(registrationClearance)
			.innerJoin(clearance, eq(registrationClearance.clearanceId, clearance.id))
			.where(
				and(
					eq(clearance.status, 'pending'),
					eq(clearance.department, department)
				)
			)
			.orderBy(desc(clearance.createdAt))
			.limit(1)
			.then((rows) => rows[0]);

		if (!nextRow) return null;

		const rc = await db.query.registrationClearance.findFirst({
			where: eq(registrationClearance.id, nextRow.id),
			with: {
				registrationRequest: { with: { student: true } },
				clearance: true,
			},
		});

		if (!rc) return null;

		return {
			...rc.clearance,
			registrationRequest: rc.registrationRequest,
		};
	}

	async findByStatusForExport(
		status: 'pending' | 'approved' | 'rejected',
		termId?: number
	) {
		const whereJoin = and(
			eq(clearance.status, status),
			termId ? eq(registrationRequests.termId, termId) : undefined
		);

		const idRows = await db
			.select({ id: registrationClearance.id })
			.from(registrationClearance)
			.innerJoin(
				registrationRequests,
				eq(registrationClearance.registrationRequestId, registrationRequests.id)
			)
			.innerJoin(clearance, eq(registrationClearance.clearanceId, clearance.id))
			.where(whereJoin)
			.orderBy(asc(clearance.createdAt));

		const ids = idRows.map((r) => r.id);
		if (ids.length === 0) return [];

		const rows = await db.query.registrationClearance.findMany({
			where: inArray(registrationClearance.id, ids),
			with: {
				clearance: { with: { respondedBy: true } },
				registrationRequest: {
					with: {
						student: true,
						term: true,
					},
				},
			},
		});

		const studentNos = rows.map((rc) => rc.registrationRequest.stdNo);
		const activePrograms = await db.query.studentPrograms.findMany({
			where: and(
				inArray(studentPrograms.stdNo, studentNos),
				eq(studentPrograms.status, 'Active')
			),
			orderBy: [asc(studentPrograms.id)],
			with: {
				structure: {
					with: {
						program: true,
					},
				},
			},
		});

		const programsByStudentNo = new Map(
			activePrograms.map((sp) => [sp.stdNo, sp])
		);

		const byIdOrder = new Map(ids.map((id, idx) => [id, idx] as const));
		return rows
			.sort((a, b) => byIdOrder.get(a.id)! - byIdOrder.get(b.id)!)
			.map((rc) => {
				const studentProgram = programsByStudentNo.get(
					rc.registrationRequest.stdNo
				);
				return {
					...rc.clearance,
					registrationRequest: {
						...rc.registrationRequest,
						student: {
							...rc.registrationRequest.student,
							programs: studentProgram ? [studentProgram] : [],
						},
					},
				};
			});
	}
}

export const clearanceRepository = new ClearanceRepository();
