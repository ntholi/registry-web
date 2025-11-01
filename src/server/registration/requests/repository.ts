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
import { db } from '@/db';
import {
	clearance,
	registrationClearance,
	registrationRequests,
	requestedModules,
	type StudentModuleStatus,
	sponsoredStudents,
	sponsoredTerms,
	studentPrograms,
	terms,
} from '@/db/schema';
import { MAX_REG_MODULES } from '@/lib/constants';
import BaseRepository, {
	type QueryOptions,
} from '@/server/base/BaseRepository';

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
					? like(registrationRequests.stdNo, `%${params.search}%`)
					: undefined,
				termId ? eq(registrationRequests.termId, termId) : undefined
			);
		} else if (status === 'approved') {
			// For approved status, require ALL clearances to be approved
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
					? like(registrationRequests.stdNo, `%${params.search}%`)
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
					? like(registrationRequests.stdNo, `%${params.search}%`)
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
			// For approved status, require ALL clearances to be approved
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
		if (modules.length > MAX_REG_MODULES)
			throw new Error(`You can only select up to ${MAX_REG_MODULES} modules.`);

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
		semesterNumber: number;
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
			const [sponsoredStudent] = await tx
				.insert(sponsoredStudents)
				.values({
					sponsorId: data.sponsorId,
					stdNo: data.stdNo,
					borrowerNo: data.borrowerNo,
					bankName: data.bankName,
					accountNumber: data.accountNumber,
				})
				.onConflictDoUpdate({
					target: [sponsoredStudents.sponsorId, sponsoredStudents.stdNo],
					set: {
						borrowerNo: data.borrowerNo,
						bankName: data.bankName,
						accountNumber: data.accountNumber,
						updatedAt: new Date(),
					},
				})
				.returning();

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
					sponsorId: data.sponsorId,
				})
				.returning();

			// Create clearance requests
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
		semesterNumber?: number,
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

			// Increment count for each update
			await tx
				.update(registrationRequests)
				.set({ count: sql`${registrationRequests.count} + 1` })
				.where(eq(registrationRequests.id, registrationRequestId));

			const [updated] = await tx
				.update(registrationRequests)
				.set(updatePayload)
				.where(eq(registrationRequests.id, registrationRequestId))
				.returning();

			// Update finance clearance status to pending
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
		semesterNumber?: number,
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

			const updatePayload: Partial<RegistrationRequestInsert> = {
				status: 'pending',
				updatedAt: new Date(),
				semesterNumber,
				semesterStatus,
				sponsorId: sponsorshipData.sponsorId,
			};
			if (typeof termId === 'number') {
				updatePayload.termId = termId;
			}

			// Check if modules have changed
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

			// Increment count for each update
			await tx
				.update(registrationRequests)
				.set({ count: sql`${registrationRequests.count} + 1` })
				.where(eq(registrationRequests.id, registrationRequestId));

			const [updated] = await tx
				.update(registrationRequests)
				.set(updatePayload)
				.where(eq(registrationRequests.id, registrationRequestId))
				.returning();

			// Update finance clearance status to pending only if modules have changed
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
				.insert(sponsoredStudents)
				.values({
					sponsorId: sponsorshipData.sponsorId,
					stdNo: registration.stdNo,
					borrowerNo: sponsorshipData.borrowerNo,
					bankName: sponsorshipData.bankName,
					accountNumber: sponsorshipData.accountNumber,
				})
				.onConflictDoUpdate({
					target: [sponsoredStudents.sponsorId, sponsoredStudents.stdNo],
					set: {
						borrowerNo: sponsorshipData.borrowerNo,
						bankName: sponsorshipData.bankName,
						accountNumber: sponsorshipData.accountNumber,
						updatedAt: new Date(),
					},
				});

			const sponsoredStudent = await tx.query.sponsoredStudents.findFirst({
				where: and(
					eq(sponsoredStudents.sponsorId, sponsorshipData.sponsorId),
					eq(sponsoredStudents.stdNo, registration.stdNo)
				),
			});

			if (sponsoredStudent) {
				const term = await tx.query.terms.findFirst({
					where: eq(terms.id, registration.termId),
				});

				if (term) {
					await tx
						.insert(sponsoredTerms)
						.values({
							sponsoredStudentId: sponsoredStudent.id,
							termId: term.id,
						})
						.onConflictDoNothing();
				}
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
