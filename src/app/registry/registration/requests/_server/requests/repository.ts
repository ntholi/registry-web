import {
	and,
	count,
	desc,
	eq,
	exists,
	inArray,
	isNull,
	ne,
	not,
	sql,
} from 'drizzle-orm';
import { config } from '@/config';
import {
	autoApprovals,
	clearance,
	db,
	paymentReceipts,
	type ReceiptType,
	registrationClearance,
	registrationRequestReceipts,
	registrationRequests,
	requestedModules,
	type StudentModuleStatus,
	sponsoredStudents,
	sponsoredTerms,
	studentModules,
	studentPrograms,
	studentSemesters,
	terms,
} from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

type RegistrationRequestInsert = typeof registrationRequests.$inferInsert;
type RegistrationRequestQuery = QueryOptions<typeof registrationRequests> & {
	includeDeleted?: boolean;
};

export default class RegistrationRequestRepository extends BaseRepository<
	typeof registrationRequests,
	'id'
> {
	constructor() {
		super(registrationRequests, registrationRequests.id);
	}

	override async query(params: QueryOptions<typeof registrationRequests>) {
		const { orderBy, offset, limit } = this.buildQueryCriteria(params);

		const whereCondition = and(
			params.search
				? sql`${registrationRequests.stdNo}::text LIKE ${`%${params.search}%`}`
				: undefined,
			isNull(registrationRequests.deletedAt)
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
				registrationRequestReceipts: {
					with: {
						receipt: true,
					},
				},
			},
		});
	}

	async findAllPaginated(params: RegistrationRequestQuery, termId?: number) {
		const { offset, limit } = this.buildQueryCriteria(params);
		const includeDeleted = params.includeDeleted === true;

		const whereCondition = and(
			params.search
				? sql`${registrationRequests.stdNo}::text LIKE ${`%${params.search}%`}`
				: undefined,
			termId ? eq(registrationRequests.termId, termId) : undefined,
			includeDeleted ? undefined : isNull(registrationRequests.deletedAt)
		);

		const [total, items] = await Promise.all([
			db
				.select({ value: count() })
				.from(registrationRequests)
				.where(whereCondition)
				.then((res) => res[0].value),
			db.query.registrationRequests.findMany({
				where: whereCondition,
				with: {
					student: true,
					clearances: {
						with: {
							clearance: true,
						},
					},
				},
				limit,
				offset,
				orderBy: [desc(registrationRequests.createdAt)],
			}),
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
		const notDeleted = isNull(registrationRequests.deletedAt);
		if (status === 'registered') {
			const [result] = await db
				.select({ value: count() })
				.from(registrationRequests)
				.where(
					and(
						eq(registrationRequests.status, status),
						notDeleted,
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
						notDeleted,
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
						notDeleted,
						termId ? eq(registrationRequests.termId, termId) : undefined
					)
				);
			return result.value;
		}
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

	private async finalizeRegistration(
		// biome-ignore lint/suspicious/noExplicitAny: transaction type from drizzle
		tx: any,
		registrationRequestId: number,
		existingSemesterId?: number
	) {
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
		if (!activeProgram) throw new Error('No active program found');

		const structureSemester = activeProgram.structure.semesters.find(
			(s: { semesterNumber: string }) =>
				s.semesterNumber === request.semesterNumber
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

		if (existingSemesterId) {
			semesterId = existingSemesterId;
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
				pendingModules.map(
					(rm: {
						semesterModuleId: number;
						moduleStatus: StudentModuleStatus;
						semesterModule: { credits: number };
					}) => ({
						semesterModuleId: rm.semesterModuleId,
						status: rm.moduleStatus,
						marks: 'NM',
						grade: 'NM' as const,
						credits: rm.semesterModule.credits,
						studentSemesterId: semesterId,
					})
				)
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

	async findExistingStudentSemester(stdNo: number, termId: number) {
		const term = await db.query.terms.findFirst({
			where: eq(terms.id, termId),
		});
		if (!term) return null;

		const activeProgram = await db.query.studentPrograms.findFirst({
			where: and(
				eq(studentPrograms.stdNo, stdNo),
				eq(studentPrograms.status, 'Active')
			),
		});
		if (!activeProgram) return null;

		const inactiveStatuses = [
			'Deleted',
			'Deferred',
			'DroppedOut',
			'Withdrawn',
			'Inactive',
		] as const;

		return db.query.studentSemesters.findFirst({
			where: and(
				eq(studentSemesters.studentProgramId, activeProgram.id),
				eq(studentSemesters.termCode, term.code),
				not(inArray(studentSemesters.status, [...inactiveStatuses]))
			),
			with: {
				studentModules: true,
			},
		});
	}

	async getExistingRegistrationSponsorship(stdNo: number, termId: number) {
		const existingRequest = await db.query.registrationRequests.findFirst({
			where: and(
				eq(registrationRequests.stdNo, stdNo),
				eq(registrationRequests.termId, termId),
				isNull(registrationRequests.deletedAt)
			),
			with: {
				sponsoredStudent: {
					with: {
						sponsor: true,
					},
				},
			},
			orderBy: desc(registrationRequests.createdAt),
		});

		if (!existingRequest?.sponsoredStudent) return null;

		const { sponsoredStudent } = existingRequest;
		return {
			sponsorId: sponsoredStudent.sponsorId,
			sponsorName: sponsoredStudent.sponsor?.name ?? null,
			sponsorCode: sponsoredStudent.sponsor?.code ?? null,
			borrowerNo: sponsoredStudent.borrowerNo,
			bankName: sponsoredStudent.bankName,
			accountNumber: sponsoredStudent.accountNumber,
		};
	}

	async getAlreadyRegisteredModuleIds(
		studentSemesterId: number,
		moduleIds: number[]
	) {
		const existing = await db.query.studentModules.findMany({
			where: and(
				eq(studentModules.studentSemesterId, studentSemesterId),
				inArray(studentModules.semesterModuleId, moduleIds)
			),
			columns: { semesterModuleId: true },
		});
		return existing.map((m) => m.semesterModuleId);
	}

	async createWithModules(data: {
		stdNo: number;
		termId: number;
		modules: { moduleId: number; moduleStatus: StudentModuleStatus }[];
		sponsorId: number;
		semesterStatus: 'Active' | 'Repeat';
		semesterNumber: string;
		borrowerNo?: string;
		bankName?: string;
		accountNumber?: string;
		receipts?: { receiptNo: string; receiptType: ReceiptType }[];
	}) {
		const existingSemester = await this.findExistingStudentSemester(
			data.stdNo,
			data.termId
		);
		const isAdditionalRequest = !!existingSemester;

		if (existingSemester) {
			const moduleIds = data.modules.map((m) => m.moduleId);
			const alreadyRegistered = await this.getAlreadyRegisteredModuleIds(
				existingSemester.id,
				moduleIds
			);
			if (alreadyRegistered.length > 0) {
				throw new Error(
					`Some modules are already registered for this term. Remove duplicates and try again.`
				);
			}
		}

		let existingSponsoredStudentId: number | null = null;
		if (isAdditionalRequest) {
			const existingRequest = await db.query.registrationRequests.findFirst({
				where: and(
					eq(registrationRequests.stdNo, data.stdNo),
					eq(registrationRequests.termId, data.termId),
					isNull(registrationRequests.deletedAt)
				),
				columns: { sponsoredStudentId: true },
			});
			existingSponsoredStudentId = existingRequest?.sponsoredStudentId ?? null;
		}

		return db.transaction(async (tx) => {
			const student = await tx.query.students.findFirst({
				where: (students, { eq }) => eq(students.stdNo, data.stdNo),
			});

			if (!student) {
				throw new Error('Student not found');
			}

			let sponsoredStudentId: number;

			if (isAdditionalRequest && existingSponsoredStudentId) {
				sponsoredStudentId = existingSponsoredStudentId;
			} else {
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

				sponsoredStudentId = sponsoredStudent.id;
			}

			const [request] = await tx
				.insert(registrationRequests)
				.values({
					stdNo: data.stdNo,
					termId: data.termId,
					status: 'pending',
					semesterNumber: data.semesterNumber,
					semesterStatus: data.semesterStatus,
					sponsoredStudentId: sponsoredStudentId,
					studentSemesterId: existingSemester?.id ?? null,
				})
				.returning();

			const matchingRules = await tx.query.autoApprovals.findMany({
				where: and(
					eq(autoApprovals.stdNo, data.stdNo),
					eq(autoApprovals.termId, data.termId)
				),
			});

			const autoApprovedDepts = new Set(matchingRules.map((r) => r.department));

			const departments: ('finance' | 'library')[] = isAdditionalRequest
				? ['finance']
				: ['finance', 'library'];

			for (const department of departments) {
				const isAutoApproved = autoApprovedDepts.has(department);
				const [clearanceRecord] = await tx
					.insert(clearance)
					.values({
						department,
						status: isAutoApproved ? 'approved' : 'pending',
						message: isAutoApproved ? 'Auto-approved' : null,
						responseDate: isAutoApproved ? new Date() : null,
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

			if (data.receipts && data.receipts.length > 0) {
				for (const receipt of data.receipts) {
					const [newReceipt] = await tx
						.insert(paymentReceipts)
						.values({
							receiptNo: receipt.receiptNo,
							receiptType: receipt.receiptType,
							stdNo: data.stdNo,
						})
						.returning();

					await tx.insert(registrationRequestReceipts).values({
						registrationRequestId: request.id,
						receiptId: newReceipt.id,
					});
				}
			}

			const allAutoApproved = departments.every((dept) =>
				autoApprovedDepts.has(dept)
			);

			if (allAutoApproved) {
				await this.finalizeRegistration(tx, request.id, existingSemester?.id);
			}

			return { request, modules, isAdditionalRequest };
		});
	}

	async updateWithModules(
		registrationRequestId: number,
		modules: { id: number; status: StudentModuleStatus }[],
		sponsorshipData?: {
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

			let sponsoredStudent: typeof sponsoredStudents.$inferSelect | undefined;

			if (sponsorshipData) {
				sponsoredStudent = await tx.query.sponsoredStudents.findFirst({
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
			}

			const updatePayload: Partial<RegistrationRequestInsert> = {
				status: 'pending',
				updatedAt: new Date(),
				semesterNumber,
				semesterStatus,
				sponsoredStudentId: sponsoredStudent?.id,
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

			if (sponsoredStudent) {
				await tx
					.insert(sponsoredTerms)
					.values({
						sponsoredStudentId: sponsoredStudent.id,
						termId: termId ?? registration.termId,
					})
					.onConflictDoNothing();
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
					isNull(registrationRequests.deletedAt),
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
			where: and(
				eq(registrationRequests.stdNo, stdNo),
				isNull(registrationRequests.deletedAt)
			),
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

	async softDelete(id: number, deletedBy: string | null) {
		const [updated] = await db
			.update(registrationRequests)
			.set({
				deletedAt: new Date(),
				deletedBy,
				updatedAt: new Date(),
			})
			.where(eq(registrationRequests.id, id))
			.returning();
		return updated;
	}
}

export const registrationRequestRepository =
	new RegistrationRequestRepository();
