import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import {
	db,
	sponsoredStudents,
	sponsoredTerms,
	sponsors,
	studentPrograms,
	students,
} from '@/core/database';
import type { AuditOptions } from '@/core/platform/BaseRepository';
import BaseRepository from '@/core/platform/BaseRepository';

type SponsoredStudent = typeof sponsoredStudents.$inferSelect;

export default class SponsorRepository extends BaseRepository<
	typeof sponsors,
	'id'
> {
	constructor() {
		super(sponsors, sponsors.id);
	}

	async findSponsor(stdNo: number, termId: number) {
		const result = await db
			.select({
				id: sponsors.id,
				name: sponsors.name,
				createdAt: sponsors.createdAt,
				updatedAt: sponsors.updatedAt,
			})
			.from(sponsors)
			.innerJoin(
				sponsoredStudents,
				eq(sponsors.id, sponsoredStudents.sponsorId)
			)
			.innerJoin(
				sponsoredTerms,
				eq(sponsoredStudents.id, sponsoredTerms.sponsoredStudentId)
			)
			.where(
				and(
					eq(sponsoredStudents.stdNo, stdNo),
					eq(sponsoredTerms.termId, termId)
				)
			)
			.limit(1);

		return result[0] || null;
	}

	async findSponsoredStudent(stdNo: number, termId: number) {
		const result = await db
			.select({
				id: sponsoredStudents.id,
				sponsorId: sponsoredStudents.sponsorId,
				stdNo: sponsoredStudents.stdNo,
				borrowerNo: sponsoredStudents.borrowerNo,
				bankName: sponsoredStudents.bankName,
				accountNumber: sponsoredStudents.accountNumber,
				createdAt: sponsoredStudents.createdAt,
				updatedAt: sponsoredStudents.updatedAt,
				sponsor: {
					id: sponsors.id,
					name: sponsors.name,
					createdAt: sponsors.createdAt,
					updatedAt: sponsors.updatedAt,
				},
			})
			.from(sponsoredStudents)
			.innerJoin(sponsors, eq(sponsoredStudents.sponsorId, sponsors.id))
			.innerJoin(
				sponsoredTerms,
				eq(sponsoredStudents.id, sponsoredTerms.sponsoredStudentId)
			)
			.where(
				and(
					eq(sponsoredStudents.stdNo, stdNo),
					eq(sponsoredTerms.termId, termId)
				)
			)
			.limit(1);

		return result[0] || null;
	}

	async findCurrentSponsoredStudent(stdNo: number) {
		const data = await db.query.sponsoredStudents.findFirst({
			where: eq(sponsoredStudents.stdNo, stdNo),
			with: {
				sponsor: true,
			},
			orderBy: desc(sponsoredStudents.createdAt),
		});

		return data;
	}

	async findSponsoredStudentsBySponsor(
		sponsorId: string,
		params?: { page?: number; limit?: number; search?: string }
	) {
		const page = params?.page || 1;
		const limit = params?.limit || 10;
		const offset = (page - 1) * limit;

		const baseCondition = eq(sponsoredStudents.sponsorId, Number(sponsorId));
		let whereCondition = baseCondition;

		if (params?.search) {
			const searchCondition = or(
				ilike(students.name, `%${params.search}%`),
				ilike(sql`CAST(${students.stdNo} AS TEXT)`, `%${params.search}%`),
				ilike(sponsoredStudents.borrowerNo, `%${params.search}%`),
				ilike(sponsoredStudents.bankName, `%${params.search}%`),
				ilike(sponsoredStudents.accountNumber, `%${params.search}%`)
			);
			whereCondition = and(baseCondition, searchCondition)!;
		}

		const totalItemsQuery = db
			.select({ count: sql<number>`count(*)` })
			.from(sponsoredStudents)
			.innerJoin(students, eq(sponsoredStudents.stdNo, students.stdNo));

		if (params?.search) {
			totalItemsQuery.where(whereCondition);
		} else {
			totalItemsQuery.where(eq(sponsoredStudents.sponsorId, Number(sponsorId)));
		}

		const totalItems = await totalItemsQuery.then(
			(result) => result[0]?.count || 0
		);

		const itemsQuery = db
			.select()
			.from(sponsoredStudents)
			.innerJoin(students, eq(sponsoredStudents.stdNo, students.stdNo))
			.limit(limit)
			.offset(offset)
			.orderBy(desc(sponsoredStudents.createdAt));

		if (params?.search) {
			itemsQuery.where(whereCondition);
		} else {
			itemsQuery.where(eq(sponsoredStudents.sponsorId, Number(sponsorId)));
		}

		const rawItems = await itemsQuery;

		const sponsoredStudentIds = rawItems.map(
			(item) => item.sponsored_students.id
		);

		const items = await db.query.sponsoredStudents.findMany({
			where: inArray(sponsoredStudents.id, sponsoredStudentIds),
			with: {
				student: {
					with: {
						programs: {
							where: eq(studentPrograms.status, 'Active'),
							with: {
								structure: {
									with: {
										program: {
											with: {
												school: true,
											},
										},
									},
								},
							},
						},
					},
				},
			},
			orderBy: desc(sponsoredStudents.createdAt),
		});

		return {
			items,
			totalItems,
			totalPages: Math.ceil(totalItems / limit),
			currentPage: page,
		};
	}

	async findAllSponsoredStudents(params?: {
		page?: number;
		limit?: number;
		search?: string;
		sponsorId?: string;
		programId?: string;
		termId?: string;
		clearedOnly?: boolean;
	}) {
		const page = params?.page || 1;
		const limit = params?.limit || 10;
		const offset = (page - 1) * limit;

		const whereConditions = [];

		if (params?.search) {
			whereConditions.push(
				or(
					ilike(students.name, `%${params.search}%`),
					ilike(sql`CAST(${students.stdNo} AS TEXT)`, `%${params.search}%`),
					ilike(sponsoredStudents.borrowerNo, `%${params.search}%`),
					ilike(sponsoredStudents.bankName, `%${params.search}%`),
					ilike(sponsoredStudents.accountNumber, `%${params.search}%`),
					ilike(sponsors.name, `%${params.search}%`)
				)
			);
		}

		if (params?.sponsorId) {
			whereConditions.push(
				eq(sponsoredStudents.sponsorId, Number(params.sponsorId))
			);
		}

		if (params?.programId) {
			whereConditions.push(
				sql`EXISTS (
          SELECT 1 FROM student_programs sp 
          JOIN structures s ON sp.structure_id = s.id 
          WHERE sp.std_no = ${students.stdNo} 
          AND sp.status = 'Active' 
          AND s.program_id = ${Number(params.programId)}
        )`
			);
		}

		if (params?.termId) {
			whereConditions.push(
				sql`EXISTS (
          SELECT 1 FROM sponsored_terms st 
          WHERE st.sponsored_student_id = ${sponsoredStudents.id} 
          AND st.term_id = ${Number(params.termId)}
        )`
			);
		}

		if (params?.clearedOnly && params.termId) {
			whereConditions.push(
				sql`EXISTS (
          SELECT 1
          FROM registration_requests rr
          WHERE rr.std_no = ${students.stdNo}
            AND rr.term_id = ${Number(params.termId)}
            AND NOT EXISTS (
              SELECT 1 FROM registration_clearance rc
              INNER JOIN clearance c ON rc.clearance_id = c.id
              WHERE rc.registration_request_id = rr.id
                AND c.status != 'approved'
            )
            AND EXISTS (
              SELECT 1 FROM registration_clearance rc2
              WHERE rc2.registration_request_id = rr.id
            )
        )`
			);
		}

		const whereCondition =
			whereConditions.length > 0 ? and(...whereConditions) : undefined;

		const totalItemsQuery = db
			.select({ count: sql<number>`count(*)` })
			.from(sponsoredStudents)
			.innerJoin(students, eq(sponsoredStudents.stdNo, students.stdNo))
			.innerJoin(sponsors, eq(sponsoredStudents.sponsorId, sponsors.id));

		if (whereCondition) {
			totalItemsQuery.where(whereCondition);
		}

		const totalItems = await totalItemsQuery.then(
			(result) => result[0]?.count || 0
		);

		const itemsQuery = db
			.select()
			.from(sponsoredStudents)
			.innerJoin(students, eq(sponsoredStudents.stdNo, students.stdNo))
			.innerJoin(sponsors, eq(sponsoredStudents.sponsorId, sponsors.id))
			.limit(limit)
			.offset(offset)
			.orderBy(desc(sponsoredStudents.createdAt));

		if (whereCondition) {
			itemsQuery.where(whereCondition);
		}

		const rawItems = await itemsQuery;

		const sponsoredStudentIds = rawItems.map(
			(item) => item.sponsored_students.id
		);

		const items = await db.query.sponsoredStudents.findMany({
			where: inArray(sponsoredStudents.id, sponsoredStudentIds),
			with: {
				sponsor: true,
				student: {
					with: {
						programs: {
							where: eq(studentPrograms.status, 'Active'),
							with: {
								structure: {
									with: {
										program: {
											with: {
												school: true,
											},
										},
									},
								},
							},
						},
					},
				},
			},
			orderBy: desc(sponsoredStudents.createdAt),
		});

		return {
			items,
			totalItems,
			totalPages: Math.ceil(totalItems / limit),
			currentPage: page,
		};
	}

	async upsertSponsoredStudent(data: {
		stdNo: number;
		termId: number;
		sponsorId: number;
		borrowerNo?: string;
		bankName?: string;
		accountNumber?: string;
	}) {
		const existing = await this.findSponsoredStudent(data.stdNo, data.termId);

		if (existing) {
			const updateData: {
				sponsorId: number;
				borrowerNo?: string;
				bankName?: string;
				accountNumber?: string;
				updatedAt: Date;
			} = {
				sponsorId: data.sponsorId,
				borrowerNo: data.borrowerNo,
				bankName: data.bankName,
				accountNumber: data.accountNumber,
				updatedAt: new Date(),
			};

			await db
				.update(sponsoredStudents)
				.set(updateData)
				.where(eq(sponsoredStudents.id, existing.id));

			return await this.findSponsoredStudent(data.stdNo, data.termId);
		} else {
			return await db.transaction(async (tx) => {
				let sponsoredStudent = await tx.query.sponsoredStudents.findFirst({
					where: eq(sponsoredStudents.stdNo, data.stdNo),
				});

				if (!sponsoredStudent) {
					const [newSponsoredStudent] = await tx
						.insert(sponsoredStudents)
						.values({
							stdNo: data.stdNo,
							sponsorId: data.sponsorId,
							borrowerNo: data.borrowerNo,
							bankName: data.bankName,
							accountNumber: data.accountNumber,
						})
						.returning();
					sponsoredStudent = newSponsoredStudent;
				}

				await tx.insert(sponsoredTerms).values({
					sponsoredStudentId: sponsoredStudent.id,
					termId: data.termId,
				});

				return await this.findSponsoredStudent(data.stdNo, data.termId);
			});
		}
	}

	async updateAccountDetails(data: {
		stdNoOrName: string;
		bankName: string;
		accountNumber: string;
	}) {
		const isNumeric = !Number.isNaN(Number(data.stdNoOrName));

		if (isNumeric) {
			const stdNo = Number(data.stdNoOrName);
			return await db
				.update(sponsoredStudents)
				.set({
					bankName: data.bankName,
					accountNumber: data.accountNumber,
					updatedAt: sql`(unixepoch())`,
				})
				.where(eq(sponsoredStudents.stdNo, stdNo))
				.returning();
		} else {
			const student = await db.query.students.findFirst({
				where: ilike(students.name, `%${data.stdNoOrName}%`),
			});

			if (!student) {
				throw new Error(`Student with name "${data.stdNoOrName}" not found`);
			}

			return await db
				.update(sponsoredStudents)
				.set({
					bankName: data.bankName,
					accountNumber: data.accountNumber,
					updatedAt: sql`(unixepoch())`,
				})
				.where(eq(sponsoredStudents.stdNo, student.stdNo))
				.returning();
		}
	}

	async bulkUpdateAccountDetails(
		items: Array<{
			stdNoOrName: string;
			bankName: string;
			accountNumber: string;
		}>,
		batchSize: number = 100
	): Promise<
		Array<{
			success: boolean;
			data?: SponsoredStudent[];
			error?: string;
			item: {
				stdNoOrName: string;
				bankName: string;
				accountNumber: string;
			};
		}>
	> {
		const results: Array<{
			success: boolean;
			data?: SponsoredStudent[];
			error?: string;
			item: {
				stdNoOrName: string;
				bankName: string;
				accountNumber: string;
			};
		}> = [];

		for (let i = 0; i < items.length; i += batchSize) {
			const batch = items.slice(i, i + batchSize);
			const batchResults = await this.processBatch(batch);
			results.push(...batchResults);
		}

		return results;
	}

	private async processBatch(
		batch: Array<{
			stdNoOrName: string;
			bankName: string;
			accountNumber: string;
		}>
	): Promise<
		Array<{
			success: boolean;
			data?: SponsoredStudent[];
			error?: string;
			item: {
				stdNoOrName: string;
				bankName: string;
				accountNumber: string;
			};
		}>
	> {
		const results: Array<{
			success: boolean;
			data?: SponsoredStudent[];
			error?: string;
			item: {
				stdNoOrName: string;
				bankName: string;
				accountNumber: string;
			};
		}> = [];

		await db.transaction(async (tx) => {
			for (const item of batch) {
				try {
					const isNumeric = !Number.isNaN(Number(item.stdNoOrName));

					if (isNumeric) {
						const stdNo = Number(item.stdNoOrName);
						const result = await tx
							.update(sponsoredStudents)
							.set({
								bankName: item.bankName,
								accountNumber: item.accountNumber,
								updatedAt: sql`(unixepoch())`,
							})
							.where(eq(sponsoredStudents.stdNo, stdNo))
							.returning();

						if (result.length > 0) {
							results.push({ success: true, data: result, item });
						} else {
							results.push({
								success: false,
								error: `No sponsored student found with student number: ${item.stdNoOrName}`,
								item,
							});
						}
					} else {
						const student = await tx.query.students.findFirst({
							where: ilike(students.name, `%${item.stdNoOrName}%`),
						});

						if (!student) {
							results.push({
								success: false,
								error: `Student with name "${item.stdNoOrName}" not found`,
								item,
							});
							continue;
						}

						const result = await tx
							.update(sponsoredStudents)
							.set({
								bankName: item.bankName,
								accountNumber: item.accountNumber,
								updatedAt: sql`(unixepoch())`,
							})
							.where(eq(sponsoredStudents.stdNo, student.stdNo))
							.returning();

						if (result.length > 0) {
							results.push({ success: true, data: result, item });
						} else {
							results.push({
								success: false,
								error: `No sponsored student found for: ${item.stdNoOrName}`,
								item,
							});
						}
					}
				} catch (error) {
					results.push({
						success: false,
						error: error instanceof Error ? error.message : 'Unknown error',
						item,
					});
				}
			}
		});

		return results;
	}

	async findStudentSponsors(stdNo: number) {
		const result = await db.query.sponsoredStudents.findMany({
			where: eq(sponsoredStudents.stdNo, stdNo),
			with: {
				sponsor: true,
				sponsoredTerms: {
					with: {
						term: true,
					},
				},
			},
			orderBy: desc(sponsoredStudents.createdAt),
		});

		return result;
	}

	async createSponsoredStudent(
		data: {
			stdNo: number;
			sponsorId: number;
			borrowerNo?: string;
			bankName?: string;
			accountNumber?: string;
		},
		audit?: AuditOptions
	) {
		const existing = await db.query.sponsoredStudents.findFirst({
			where: and(
				eq(sponsoredStudents.stdNo, data.stdNo),
				eq(sponsoredStudents.sponsorId, data.sponsorId)
			),
		});

		if (existing) {
			throw new Error(
				'Student already has a sponsorship record for this sponsor'
			);
		}

		if (!audit) {
			const [result] = await db
				.insert(sponsoredStudents)
				.values({
					stdNo: data.stdNo,
					sponsorId: data.sponsorId,
					borrowerNo: data.borrowerNo,
					bankName: data.bankName,
					accountNumber: data.accountNumber,
				})
				.returning();
			return result;
		}

		return db.transaction(async (tx) => {
			const [result] = await tx
				.insert(sponsoredStudents)
				.values({
					stdNo: data.stdNo,
					sponsorId: data.sponsorId,
					borrowerNo: data.borrowerNo,
					bankName: data.bankName,
					accountNumber: data.accountNumber,
				})
				.returning();

			await this.writeAuditLogForTable(
				tx,
				'sponsored_students',
				'INSERT',
				String(result.id),
				null,
				result,
				audit
			);

			return result;
		});
	}

	async updateSponsoredStudent(
		id: number,
		data: {
			sponsorId?: number;
			borrowerNo?: string | null;
			bankName?: string | null;
			accountNumber?: string | null;
		},
		audit?: AuditOptions
	) {
		if (!audit) {
			const [result] = await db
				.update(sponsoredStudents)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(sponsoredStudents.id, id))
				.returning();
			return result;
		}

		return db.transaction(async (tx) => {
			const [old] = await tx
				.select()
				.from(sponsoredStudents)
				.where(eq(sponsoredStudents.id, id));

			const [result] = await tx
				.update(sponsoredStudents)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(sponsoredStudents.id, id))
				.returning();

			if (old) {
				await this.writeAuditLogForTable(
					tx,
					'sponsored_students',
					'UPDATE',
					String(id),
					old,
					result,
					audit
				);
			}

			return result;
		});
	}

	async findSponsoredStudentById(id: number) {
		return db.query.sponsoredStudents.findFirst({
			where: eq(sponsoredStudents.id, id),
			with: {
				sponsor: true,
				sponsoredTerms: {
					with: {
						term: true,
					},
				},
			},
		});
	}
}

export const sponsorsRepository = new SponsorRepository();
