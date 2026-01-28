import type { ProgramLevel } from '@academic/_database';
import { and, asc, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { auth } from '@/core/auth';
import {
	autoApprovals,
	clearance,
	clearanceAudit,
	type DashboardUser,
	db,
	programs,
	registrationClearance,
	registrationRequestReceipts,
	registrationRequests,
	requestedModules,
	structureSemesters,
	structures,
	studentModules,
	studentPrograms,
	studentSemesters,
} from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

type Transaction = Parameters<(typeof db)['transaction']>[0] extends (
	tx: infer T
) => Promise<unknown>
	? T
	: never;

export interface ClearanceFilterOptions {
	termId?: number;
	schoolId?: number;
	programId?: number;
	programLevel?: ProgramLevel;
	semester?: string;
}

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

					if (data.status === 'approved') {
						await this.finalizeIfAllApproved(
							tx,
							regClearance.registrationRequestId
						);
					}
				}
			}

			return [clearanceRecord];
		});

		return updated;
	}

	private async finalizeIfAllApproved(
		tx: Transaction,
		registrationRequestId: number
	) {
		const allClearances = await tx.query.registrationClearance.findMany({
			where: eq(
				registrationClearance.registrationRequestId,
				registrationRequestId
			),
			with: { clearance: true },
		});

		const allApproved = allClearances.every(
			(c) => c.clearance.status === 'approved'
		);
		if (!allApproved) return;

		const request = await tx.query.registrationRequests.findFirst({
			where: eq(registrationRequests.id, registrationRequestId),
			with: {
				term: true,
				student: {
					with: {
						programs: {
							where: eq(studentPrograms.status, 'Active'),
							limit: 1,
							with: {
								structure: {
									with: {
										semesters: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!request) throw new Error('Registration request not found');
		if (request.status === 'registered') return;

		const activeProgram = request.student.programs[0];
		if (!activeProgram) throw new Error('No active program found for student');

		const structureSemester = activeProgram.structure.semesters.find(
			(s) => s.semesterNumber === request.semesterNumber
		);
		if (!structureSemester)
			throw new Error(
				`Structure semester not found for semester ${request.semesterNumber}`
			);

		const pendingModules = await tx.query.requestedModules.findMany({
			where: and(
				eq(requestedModules.registrationRequestId, registrationRequestId),
				eq(requestedModules.status, 'pending')
			),
			with: {
				semesterModule: true,
			},
		});

		const [semester] = await tx
			.insert(studentSemesters)
			.values({
				termCode: request.term.code,
				structureSemesterId: structureSemester.id,
				status: request.semesterStatus,
				studentProgramId: activeProgram.id,
				registrationRequestId: request.id,
				sponsorId: request.sponsoredStudentId,
			})
			.returning();

		if (pendingModules.length > 0) {
			await tx.insert(studentModules).values(
				pendingModules.map((rm) => ({
					semesterModuleId: rm.semesterModuleId,
					status: rm.moduleStatus,
					marks: 'NM',
					grade: 'NM' as const,
					credits: rm.semesterModule.credits,
					studentSemesterId: semester.id,
				}))
			);
		}

		await tx
			.update(requestedModules)
			.set({ status: 'registered' })
			.where(
				and(
					eq(requestedModules.registrationRequestId, registrationRequestId),
					eq(requestedModules.status, 'pending')
				)
			);

		await tx
			.update(registrationRequests)
			.set({ status: 'registered', dateRegistered: new Date() })
			.where(eq(registrationRequests.id, registrationRequestId));
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

		const [studentProgram, modules, receipts] = await Promise.all([
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
			db.query.registrationRequestReceipts.findMany({
				where: eq(
					registrationRequestReceipts.registrationRequestId,
					rc.registrationRequest.id
				),
				with: {
					receipt: true,
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
				registrationRequestReceipts: receipts,
			},
		};
	}

	async findByDepartment(
		department: DashboardUser,
		params: QueryOptions<typeof clearance>,
		status?: 'pending' | 'approved' | 'rejected',
		filter?: ClearanceFilterOptions
	) {
		const { offset, limit } = this.buildQueryCriteria(params);

		const hasAdvancedFilter =
			filter?.schoolId || filter?.programId || filter?.programLevel;
		const hasSemesterFilter = filter?.semester;

		const baseConditions = and(
			params.search
				? sql`${registrationRequests.stdNo}::text LIKE ${`%${params.search}%`}`
				: undefined,
			filter?.termId
				? eq(registrationRequests.termId, filter.termId)
				: undefined,
			eq(clearance.department, department),
			status ? eq(clearance.status, status) : undefined
		);

		const programConditions = hasAdvancedFilter
			? and(
					filter.schoolId ? eq(programs.schoolId, filter.schoolId) : undefined,
					filter.programId ? eq(programs.id, filter.programId) : undefined,
					filter.programLevel
						? eq(programs.level, filter.programLevel)
						: undefined
				)
			: undefined;

		const semesterCondition = hasSemesterFilter
			? eq(structureSemesters.semesterNumber, filter.semester!)
			: undefined;

		let countQuery = db
			.select({ total: count() })
			.from(registrationClearance)
			.innerJoin(
				registrationRequests,
				eq(registrationClearance.registrationRequestId, registrationRequests.id)
			)
			.innerJoin(clearance, eq(registrationClearance.clearanceId, clearance.id))
			.$dynamic();

		if (hasAdvancedFilter || hasSemesterFilter) {
			countQuery = countQuery
				.innerJoin(
					studentSemesters,
					eq(studentSemesters.registrationRequestId, registrationRequests.id)
				)
				.innerJoin(
					studentPrograms,
					eq(studentSemesters.studentProgramId, studentPrograms.id)
				)
				.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
				.innerJoin(programs, eq(structures.programId, programs.id));
		}

		if (hasSemesterFilter) {
			countQuery = countQuery.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			);
		}

		const whereJoin = and(baseConditions, programConditions, semesterCondition);
		const [{ total }] = await countQuery.where(whereJoin);

		if (total === 0) {
			return { items: [], totalPages: 0, totalItems: 0 };
		}

		let idQuery = db
			.select({ id: registrationClearance.id })
			.from(registrationClearance)
			.innerJoin(
				registrationRequests,
				eq(registrationClearance.registrationRequestId, registrationRequests.id)
			)
			.innerJoin(clearance, eq(registrationClearance.clearanceId, clearance.id))
			.$dynamic();

		if (hasAdvancedFilter || hasSemesterFilter) {
			idQuery = idQuery
				.innerJoin(
					studentSemesters,
					eq(studentSemesters.registrationRequestId, registrationRequests.id)
				)
				.innerJoin(
					studentPrograms,
					eq(studentSemesters.studentProgramId, studentPrograms.id)
				)
				.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
				.innerJoin(programs, eq(structures.programId, programs.id));
		}

		if (hasSemesterFilter) {
			idQuery = idQuery.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			);
		}

		const idRows = await idQuery
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

		const [clearanceRows, autoApprovalRows] = await Promise.all([
			ids.length > 0
				? db.query.registrationClearance.findMany({
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
					})
				: Promise.resolve([]),
			db.query.autoApprovals.findMany({
				where: and(
					eq(autoApprovals.stdNo, stdNo),
					eq(autoApprovals.department, department)
				),
				with: {
					term: true,
					createdByUser: true,
				},
				orderBy: (aa, { desc: d }) => [d(aa.createdAt)],
			}),
		]);

		const autoApprovalTermIds = new Set(
			autoApprovalRows.map((aa) => aa.termId)
		);

		const clearanceHistory = clearanceRows
			.filter((rc) => !autoApprovalTermIds.has(rc.registrationRequest.termId))
			.map((rc) => ({
				...rc.clearance,
				registrationRequest: rc.registrationRequest,
				isAutoApproval: false as const,
			}));

		const autoApprovalHistory = autoApprovalRows.map((aa) => ({
			id: aa.id,
			department: aa.department,
			status: 'approved' as const,
			message: 'Auto-approved',
			emailSent: null,
			respondedBy: aa.createdBy,
			responseDate: aa.createdAt,
			createdAt: aa.createdAt,
			registrationRequest: { term: aa.term },
			audits: [
				{
					id: aa.id,
					clearanceId: aa.id,
					previousStatus: null,
					newStatus: 'approved' as const,
					createdBy: aa.createdBy,
					date: aa.createdAt,
					message: 'Auto-approved',
					modules: null,
					user: aa.createdByUser,
				},
			],
			isAutoApproval: true as const,
		}));

		const combined = [...clearanceHistory, ...autoApprovalHistory].sort(
			(a, b) => {
				const dateA = a.createdAt ?? new Date(0);
				const dateB = b.createdAt ?? new Date(0);
				return new Date(dateB).getTime() - new Date(dateA).getTime();
			}
		);

		return combined;
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
