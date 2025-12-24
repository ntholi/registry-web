import {
	and,
	count,
	desc,
	eq,
	exists,
	inArray,
	like,
	ne,
	not,
	sql,
} from 'drizzle-orm';
import type { SQL } from 'drizzle-orm/sql';
import { config } from '@/config';
import {
	clearance,
	db,
	registrationClearance,
	registrationRequests,
	requestedModules,
	type StudentModuleStatus,
	sponsoredStudents,
	sponsoredTerms,
	studentPrograms,
} from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

type RequestedModule = typeof requestedModules.$inferInsert;
type RegistrationRequestInsert = typeof registrationRequests.$inferInsert;

export default class RegistrationRequestRepository extends BaseRepository<
	typeof registrationRequests,
	'id'
> {
	constructor() {
		super(registrationRequests, registrationRequests.id);
	}

	override async query(params: QueryOptions<typeof registrationRequests>) {
		const { orderBy, offset, limit } = this.buildQueryCriteria(params);

		const whereCondition = like(
			registrationRequests.stdNo,
			`%${params.search}%`
		);

		const data = await db.query.registrationRequests.findMany({
			where: whereCondition,
			with: {
				student: true,
			},
			orderBy,
			limit,
			offset,
		});

		return await this.createPaginatedResult(data, {
			where: whereCondition,
			limit,
		});
	}

	async findById(id: number) {
		return db.query.registrationRequests.findFirst({
			where: eq(registrationRequests.id, id),
			with: {
				student: {
					with: {
						programs: {
							where: eq(studentPrograms.status, 'Active'),
							orderBy: (programs, { asc }) => [asc(programs.id)],
							limit: 1,
							with: {
								structure: {
									with: {
										program: true,
									},
								},
							},
						},
					},
				},
				term: true,
				sponsoredStudent: {
					with: {
						sponsor: true,
					},
				},
				requestedModules: {
					with: {
						semesterModule: {
							with: {
								module: true,
							},
						},
					},
				},
				clearances: {
					with: {
						clearance: {
							with: {
								respondedBy: true,
							},
						},
					},
				},
			},
		});
	}

	async findByStdNo(stdNo: number, termId: number) {
		return db.query.registrationRequests.findFirst({
			where: and(
				eq(registrationRequests.stdNo, stdNo),
				eq(registrationRequests.termId, termId)
			),
			with: {
				requestedModules: {
					with: {
						semesterModule: {
							with: {
								module: true,
							},
						},
					},
				},
			},
		});
	}

	async findByStatus(
		status: 'pending' | 'registered' | 'rejected' | 'approved',
		params: QueryOptions<typeof registrationRequests>,
		termId?: number
	) {
		const { offset, limit } = this.buildQueryCriteria(params);

		let whereCondition: SQL<unknown> | undefined;
		if (status === 'registered') {
			whereCondition = and(
				eq(registrationRequests.status, status),
				params.search
					? sql`${registrationRequests.stdNo}::text LIKE ${`%${params.search}%`}`
					: undefined,
				termId ? eq(registrationRequests.termId, termId) : undefined
			);
		} else if (status === 'approved') {
			const approvedRequestIds = db
				.select({ id: registrationRequests.id })
				.from(registrationRequests)
				.where(
					and(
						not(
							exists(
								db
									.select()
									.from(clearance)
									.innerJoin(
										registrationClearance,
										eq(clearance.id, registrationClearance.clearanceId)
									)
									.where(
										and(
											eq(
												registrationClearance.registrationRequestId,
												registrationRequests.id
											),
											ne(clearance.status, 'approved')
										)
									)
							)
						),
						exists(
							db
								.select()
								.from(registrationClearance)
								.where(
									eq(
										registrationClearance.registrationRequestId,
										registrationRequests.id
									)
								)
						),
						ne(registrationRequests.status, 'registered'),
						termId ? eq(registrationRequests.termId, termId) : undefined
					)
				);

			whereCondition = and(
				inArray(registrationRequests.id, approvedRequestIds),
				params.search
					? sql`${registrationRequests.stdNo}::text LIKE ${`%${params.search}%`}`
					: undefined
			);
		} else {
			whereCondition = and(
				inArray(
					registrationRequests.id,
					db
						.select({ id: registrationClearance.registrationRequestId })
						.from(registrationClearance)
						.innerJoin(
							clearance,
							eq(registrationClearance.clearanceId, clearance.id)
						)
						.where(eq(clearance.status, status))
				),
				params.search
					? sql`${registrationRequests.stdNo}::text LIKE ${`%${params.search}%`}`
					: undefined,
				termId ? eq(registrationRequests.termId, termId) : undefined
			);
		}

		const query = db.query.registrationRequests.findMany({
			where: whereCondition,
			with: {
				student: true,
			},
			limit,
			offset,
		});

		const [total, items] = await Promise.all([
			db
				.select({ value: count() })
				.from(registrationRequests)
				.where(whereCondition)
				.then((res) => res[0].value),
			query,
		]);

		return {
			data: items,
			pages: Math.ceil(total / limit),
		};
	}

	async countByStatus(
		status: 'pending' | 'registered' | 'rejected' | 'approved',
		termId?: number
	) {
		if (status === 'registered') {
			const [result] = await db
				.select({ value: count() })
				.from(registrationRequests)
				.where(
					and(
						eq(registrationRequests.status, status),
						termId ? eq(registrationRequests.termId, termId) : undefined
					)
				);
			return result.value;
		} else if (status === 'approved') {
			const [result] = await db
				.select({ value: count() })
				.from(registrationRequests)
				.where(
					and(
						not(
							exists(
								db
									.select()
									.from(clearance)
									.innerJoin(
										registrationClearance,
										eq(clearance.id, registrationClearance.clearanceId)
									)
									.where(
										and(
											eq(
												registrationClearance.registrationRequestId,
												registrationRequests.id
											),
											ne(clearance.status, 'approved')
										)
									)
							)
						),
						exists(
							db
								.select()
								.from(registrationClearance)
								.where(
									eq(
										registrationClearance.registrationRequestId,
										registrationRequests.id
									)
								)
						),
						ne(registrationRequests.status, 'registered'),
						termId ? eq(registrationRequests.termId, termId) : undefined
					)
				);
			return result.value;
		} else {
			const [result] = await db
				.select({ value: count() })
				.from(registrationRequests)
				.where(
					and(
						exists(
							db
								.select()
								.from(clearance)
								.innerJoin(
									registrationClearance,
									eq(clearance.id, registrationClearance.clearanceId)
								)
								.where(
									and(
										eq(
											registrationClearance.registrationRequestId,
											registrationRequests.id
										),
										eq(clearance.status, status)
									)
								)
						),
						termId ? eq(registrationRequests.termId, termId) : undefined
					)
				);
			return result.value;
		}
	}

	async getRequestedModules(registrationRequestId: number) {
		return db.query.requestedModules.findMany({
			where: eq(requestedModules.registrationRequestId, registrationRequestId),
			with: {
				semesterModule: {
					with: {
						module: true,
					},
				},
			},
		});
	}

	async createRequestedModules(modules: RequestedModule[]) {
		return db.insert(requestedModules).values(modules).returning();
	}

	private async handleRegistrationModules(
		// biome-ignore lint/suspicious/noExplicitAny: transaction type from drizzle
		tx: any,
		registrationRequestId: number,
		modules: { moduleId: number; moduleStatus: StudentModuleStatus }[]
	) {
		if (!modules.length) throw new Error('No modules selected');
		if (modules.length > config.registry.maxRegModules)
			throw new Error(
				`You can only select up to ${config.registry.maxRegModules} modules.`
			);

		await tx
			.delete(requestedModules)
			.where(eq(requestedModules.registrationRequestId, registrationRequestId));
		const modulesToCreate = modules.map((module) => ({
			semesterModuleId: module.moduleId,
			moduleStatus: module.moduleStatus,
			registrationRequestId,
		}));

		return tx.insert(requestedModules).values(modulesToCreate).returning();
	}

	async createRegistrationWithModules(data: {
		stdNo: number;
		termId: number;
		modules: { moduleId: number; moduleStatus: StudentModuleStatus }[];
		sponsorId: number;
		semesterStatus: 'Active' | 'Repeat';
		semesterNumber: string;
		borrowerNo?: string;
		bankName?: string;
		accountNumber?: string;
	}) {
		return db.transaction(async (tx) => {
			const student = await tx.query.students.findFirst({
				where: (students, { eq }) => eq(students.stdNo, data.stdNo),
			});

			if (!student) {
				throw new Error('Student not found');
			}

			let sponsoredStudent = await tx.query.sponsoredStudents.findFirst({
				where: and(
					eq(sponsoredStudents.sponsorId, data.sponsorId),
					eq(sponsoredStudents.stdNo, data.stdNo)
				),
			});

			if (!sponsoredStudent) {
				sponsoredStudent = await tx.query.sponsoredStudents.findFirst({
					where: eq(sponsoredStudents.stdNo, data.stdNo),
				});
			}

			if (sponsoredStudent) {
				const [updated] = await tx
					.update(sponsoredStudents)
					.set({
						sponsorId: data.sponsorId,
						borrowerNo: data.borrowerNo,
						bankName: data.bankName,
						accountNumber: data.accountNumber,
						updatedAt: new Date(),
					})
					.where(eq(sponsoredStudents.id, sponsoredStudent.id))
					.returning();
				sponsoredStudent = updated;
			} else {
				const [created] = await tx
					.insert(sponsoredStudents)
					.values({
						sponsorId: data.sponsorId,
						stdNo: data.stdNo,
						borrowerNo: data.borrowerNo,
						bankName: data.bankName,
						accountNumber: data.accountNumber,
					})
					.returning();
				sponsoredStudent = created;
			}

			await tx
				.insert(sponsoredTerms)
				.values({
					sponsoredStudentId: sponsoredStudent.id,
					termId: data.termId,
				})
				.onConflictDoNothing();

			const [request] = await tx
				.insert(registrationRequests)
				.values({
					stdNo: data.stdNo,
					termId: data.termId,
					status: 'pending',
					semesterNumber: data.semesterNumber,
					semesterStatus: data.semesterStatus,
					sponsoredStudentId: sponsoredStudent.id,
				})
				.returning();

			for (const department of ['finance', 'library']) {
				const [clearanceRecord] = await tx
					.insert(clearance)
					.values({
						department: department as 'finance' | 'library',
					})
					.returning();

				await tx.insert(registrationClearance).values({
					registrationRequestId: request.id,
					clearanceId: clearanceRecord.id,
				});
			}

			const modules = await this.handleRegistrationModules(
				tx,
				request.id,
				data.modules
			);

			return { request, modules };
		});
	}

	async updateRegistrationWithModules(
		registrationRequestId: number,
		modules: { id: number; status: StudentModuleStatus }[],
		semesterNumber?: string,
		semesterStatus?: 'Active' | 'Repeat',
		termId?: number
	) {
		return db.transaction(async (tx) => {
			const updatePayload: Partial<RegistrationRequestInsert> = {
				status: 'pending',
				updatedAt: new Date(),
				semesterNumber,
				semesterStatus,
			};
			if (typeof termId === 'number') {
				updatePayload.termId = termId;
			}

			await tx
				.update(registrationRequests)
				.set({ count: sql`${registrationRequests.count} + 1` })
				.where(eq(registrationRequests.id, registrationRequestId));

			const [updated] = await tx
				.update(registrationRequests)
				.set(updatePayload)
				.where(eq(registrationRequests.id, registrationRequestId))
				.returning();

			const financeClearances = await tx
				.select({ clearanceId: registrationClearance.clearanceId })
				.from(registrationClearance)
				.innerJoin(
					clearance,
					eq(registrationClearance.clearanceId, clearance.id)
				)
				.where(
					and(
						eq(
							registrationClearance.registrationRequestId,
							registrationRequestId
						),
						eq(clearance.department, 'finance')
					)
				);

			if (financeClearances.length > 0) {
				await tx
					.update(clearance)
					.set({
						status: 'pending',
					})
					.where(eq(clearance.id, financeClearances[0].clearanceId));
			}

			const convertedModules = modules.map((module) => ({
				moduleId: module.id,
				moduleStatus: module.status,
			}));

			const updatedModules = await this.handleRegistrationModules(
				tx,
				registrationRequestId,
				convertedModules
			);
			return { request: updated, modules: updatedModules };
		});
	}

	async updateRegistrationWithModulesAndSponsorship(
		registrationRequestId: number,
		modules: { id: number; status: StudentModuleStatus }[],
		sponsorshipData: {
			sponsorId: number;
			borrowerNo?: string;
			bankName?: string;
			accountNumber?: string;
		},
		semesterNumber?: string,
		semesterStatus?: 'Active' | 'Repeat',
		termId?: number
	) {
		return db.transaction(async (tx) => {
			const registration = await tx.query.registrationRequests.findFirst({
				where: eq(registrationRequests.id, registrationRequestId),
			});

			if (!registration) {
				throw new Error('Registration request not found');
			}

			let sponsoredStudent = await tx.query.sponsoredStudents.findFirst({
				where: and(
					eq(sponsoredStudents.sponsorId, sponsorshipData.sponsorId),
					eq(sponsoredStudents.stdNo, registration.stdNo)
				),
			});

			if (!sponsoredStudent) {
				sponsoredStudent = await tx.query.sponsoredStudents.findFirst({
					where: eq(sponsoredStudents.stdNo, registration.stdNo),
				});
			}

			if (sponsoredStudent) {
				const [updated] = await tx
					.update(sponsoredStudents)
					.set({
						sponsorId: sponsorshipData.sponsorId,
						borrowerNo: sponsorshipData.borrowerNo,
						bankName: sponsorshipData.bankName,
						accountNumber: sponsorshipData.accountNumber,
						updatedAt: new Date(),
					})
					.where(eq(sponsoredStudents.id, sponsoredStudent.id))
					.returning();
				sponsoredStudent = updated;
			} else {
				const [created] = await tx
					.insert(sponsoredStudents)
					.values({
						sponsorId: sponsorshipData.sponsorId,
						stdNo: registration.stdNo,
						borrowerNo: sponsorshipData.borrowerNo,
						bankName: sponsorshipData.bankName,
						accountNumber: sponsorshipData.accountNumber,
					})
					.returning();
				sponsoredStudent = created;
			}

			const updatePayload: Partial<RegistrationRequestInsert> = {
				status: 'pending',
				updatedAt: new Date(),
				semesterNumber,
				semesterStatus,
				sponsoredStudentId: sponsoredStudent.id,
			};
			if (typeof termId === 'number') {
				updatePayload.termId = termId;
			}

			const existingModules = await tx.query.requestedModules.findMany({
				where: eq(
					requestedModules.registrationRequestId,
					registrationRequestId
				),
				columns: {
					semesterModuleId: true,
					moduleStatus: true,
				},
			});

			const hasModulesChanged =
				existingModules.length !== modules.length ||
				!modules.every((newModule) =>
					existingModules.some(
						(existing) =>
							existing.semesterModuleId === newModule.id &&
							existing.moduleStatus === newModule.status
					)
				);

			await tx
				.update(registrationRequests)
				.set({ count: sql`${registrationRequests.count} + 1` })
				.where(eq(registrationRequests.id, registrationRequestId));

			const [updated] = await tx
				.update(registrationRequests)
				.set(updatePayload)
				.where(eq(registrationRequests.id, registrationRequestId))
				.returning();

			if (hasModulesChanged) {
				const financeClearances = await tx
					.select({ clearanceId: registrationClearance.clearanceId })
					.from(registrationClearance)
					.innerJoin(
						clearance,
						eq(registrationClearance.clearanceId, clearance.id)
					)
					.where(
						and(
							eq(
								registrationClearance.registrationRequestId,
								registrationRequestId
							),
							eq(clearance.department, 'finance')
						)
					);

				if (financeClearances.length > 0) {
					await tx
						.update(clearance)
						.set({
							status: 'pending',
						})
						.where(eq(clearance.id, financeClearances[0].clearanceId));
				}
			}

			await tx
				.insert(sponsoredTerms)
				.values({
					sponsoredStudentId: sponsoredStudent.id,
					termId: termId ?? registration.termId,
				})
				.onConflictDoNothing();

			const convertedModules = modules.map((module) => ({
				moduleId: module.id,
				moduleStatus: module.status,
			}));

			const updatedModules = await this.handleRegistrationModules(
				tx,
				registrationRequestId,
				convertedModules
			);
			return { request: updated, modules: updatedModules };
		});
	}

	async findByStatusForExport(
		status: 'pending' | 'registered' | 'rejected' | 'approved',
		termId?: number
	) {
		if (status === 'registered') {
			return db.query.registrationRequests.findMany({
				where: and(
					eq(registrationRequests.status, status),
					termId ? eq(registrationRequests.termId, termId) : undefined
				),
				with: {
					student: {
						with: {
							programs: {
								where: eq(studentPrograms.status, 'Active'),
								orderBy: (programs, { asc }) => [asc(programs.id)],
								limit: 1,
								with: {
									structure: {
										with: {
											program: true,
										},
									},
								},
							},
						},
					},
					term: true,
				},
				orderBy: [desc(registrationRequests.createdAt)],
			});
		}

		return [];
	}

	async getHistory(stdNo: number) {
		return db.query.registrationRequests.findMany({
			where: eq(registrationRequests.stdNo, stdNo),
			with: {
				term: true,
				requestedModules: {
					with: {
						semesterModule: {
							with: {
								module: true,
							},
						},
					},
				},
			},
			orderBy: [desc(registrationRequests.createdAt)],
		});
	}
}

export const registrationRequestRepository =
	new RegistrationRequestRepository();
