import type { ProgramLevel } from '@academic/_database';
import { and, asc, count, desc, eq, inArray, sql } from 'drizzle-orm';
import {
	auditLogs,
	autoApprovals,
	clearance,
	type DashboardUser,
	db,
	programs,
	registrationClearance,
	registrationRequestReceipts,
	registrationRequests,
	requestedModules,
	structures,
	studentModules,
	studentPrograms,
	studentSemesters,
	students,
} from '@/core/database';
import BaseRepository, {
	type AuditOptions,
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

	override async create(
		data: Model & { registrationRequestId: number },
		audit?: AuditOptions
	) {
		const [inserted] = await db.transaction(async (tx) => {
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

			if (audit) {
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

				await this.writeAuditLog(
					tx,
					'INSERT',
					String(clearanceRecord.id),
					null,
					clearanceRecord,
					{
						userId: audit.userId,
						metadata: {
							modules: modulesList.map((rm) => rm.semesterModule.module!.code),
							...audit.metadata,
						},
					}
				);
			}

			return [clearanceRecord];
		});

		return inserted;
	}

	override async update(
		id: number,
		data: Partial<Model>,
		audit?: AuditOptions
	) {
		const [updated] = await db.transaction(async (tx) => {
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
					if (audit) {
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

						await this.writeAuditLog(
							tx,
							'UPDATE',
							String(id),
							current,
							clearanceRecord,
							{
								userId: audit.userId,
								metadata: {
									modules: modulesList.map(
										(rm) => rm.semesterModule.module!.code
									),
									...audit.metadata,
								},
							}
						);
					}

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

		let semesterId: number;

		if (request.studentSemesterId) {
			semesterId = request.studentSemesterId;
		} else {
			const [semester] = await tx
				.insert(studentSemesters)
				.values({
					termCode: request.term.code,
					structureSemesterId: structureSemester.id,
					status: request.semesterStatus,
					studentProgramId: activeProgram.id,
					sponsorId: request.sponsoredStudentId,
				})
				.returning();
			semesterId = semester.id;

			await tx
				.update(registrationRequests)
				.set({ studentSemesterId: semesterId })
				.where(eq(registrationRequests.id, registrationRequestId));
		}

		if (pendingModules.length > 0) {
			await tx.insert(studentModules).values(
				pendingModules.map((rm) => ({
					semesterModuleId: rm.semesterModuleId,
					status: rm.moduleStatus,
					marks: 'NM',
					grade: 'NM' as const,
					credits: rm.semesterModule.credits,
					studentSemesterId: semesterId,
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
						sponsoredStudent: {
							with: {
								sponsor: true,
							},
						},
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

		const needsStudentJoin = !!params.search;

		const baseConditions = and(
			params.search
				? sql`(
					${registrationRequests.stdNo}::text LIKE ${`%${params.search}%`}
					OR ${students.name} ILIKE ${`%${params.search}%`}
				)`
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
						: undefined,
					eq(studentPrograms.status, 'Active')
				)
			: undefined;

		const semesterCondition = hasSemesterFilter
			? eq(registrationRequests.semesterNumber, filter.semester!)
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

		if (needsStudentJoin) {
			countQuery = countQuery.innerJoin(
				students,
				eq(students.stdNo, registrationRequests.stdNo)
			);
		}

		if (hasAdvancedFilter) {
			countQuery = countQuery
				.innerJoin(
					studentPrograms,
					eq(studentPrograms.stdNo, registrationRequests.stdNo)
				)
				.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
				.innerJoin(programs, eq(structures.programId, programs.id));
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

		if (needsStudentJoin) {
			idQuery = idQuery.innerJoin(
				students,
				eq(students.stdNo, registrationRequests.stdNo)
			);
		}

		if (hasAdvancedFilter) {
			idQuery = idQuery
				.innerJoin(
					studentPrograms,
					eq(studentPrograms.stdNo, registrationRequests.stdNo)
				)
				.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
				.innerJoin(programs, eq(structures.programId, programs.id));
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
				clearance: true,
			},
		});

		if (!rc) return [];

		const audits = await db.query.auditLogs.findMany({
			where: and(
				eq(auditLogs.tableName, 'clearance'),
				eq(auditLogs.recordId, String(clearanceId))
			),
			orderBy: desc(auditLogs.changedAt),
			with: { changedByUser: true },
		});

		return [
			{
				...rc.clearance,
				registrationRequest: rc.registrationRequest,
				audits: audits.map((a) => ({
					id: Number(a.id),
					clearanceId,
					previousStatus:
						(a.oldValues as Record<string, string> | null)?.status ?? null,
					newStatus:
						(a.newValues as Record<string, string> | null)?.status ?? 'unknown',
					createdBy: a.changedBy ?? '',
					date: a.changedAt,
					message:
						(a.newValues as Record<string, string> | null)?.message ?? null,
					modules:
						(a.metadata as Record<string, string[]> | null)?.modules ?? [],
					user: a.changedByUser,
				})),
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
							clearance: true,
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

		const clearanceIds = clearanceRows.map((rc) => rc.clearance.id);
		const allAudits =
			clearanceIds.length > 0
				? await db.query.auditLogs.findMany({
						where: and(
							eq(auditLogs.tableName, 'clearance'),
							inArray(auditLogs.recordId, clearanceIds.map(String))
						),
						orderBy: desc(auditLogs.changedAt),
						with: { changedByUser: true },
					})
				: [];

		const auditsByRecordId = new Map<string, typeof allAudits>();
		for (const a of allAudits) {
			const list = auditsByRecordId.get(a.recordId) ?? [];
			list.push(a);
			auditsByRecordId.set(a.recordId, list);
		}

		const clearanceHistory = clearanceRows
			.filter((rc) => !autoApprovalTermIds.has(rc.registrationRequest.termId))
			.map((rc) => ({
				...rc.clearance,
				registrationRequest: rc.registrationRequest,
				audits: (auditsByRecordId.get(String(rc.clearance.id)) ?? []).map(
					(a) => ({
						id: Number(a.id),
						clearanceId: rc.clearance.id,
						previousStatus:
							(a.oldValues as Record<string, string> | null)?.status ?? null,
						newStatus:
							(a.newValues as Record<string, string> | null)?.status ??
							'unknown',
						createdBy: a.changedBy ?? '',
						date: a.changedAt,
						message:
							(a.newValues as Record<string, string> | null)?.message ?? null,
						modules:
							(a.metadata as Record<string, string[]> | null)?.modules ?? [],
						user: a.changedByUser,
					})
				),
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
