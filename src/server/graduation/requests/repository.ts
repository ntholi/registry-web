import { and, eq, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm/sql';
import { db } from '@/db';
import {
	clearance,
	graduationClearance,
	graduationRequests,
	paymentReceipts,
	type paymentType,
	studentPrograms,
} from '@/db/schema';
import BaseRepository, { type QueryOptions } from '@/server/base/BaseRepository';
import { studentsService } from '@/server/students/service';
import { getOutstandingFromStructure } from '@/utils/grades';

export default class GraduationRequestRepository extends BaseRepository<
	typeof graduationRequests,
	'id'
> {
	constructor() {
		super(graduationRequests, graduationRequests.id);
	}

	override async create(data: typeof graduationRequests.$inferInsert) {
		return db.transaction(async (tx) => {
			const [request] = await tx.insert(graduationRequests).values(data).returning();

			for (const department of ['finance', 'library']) {
				const [clearanceRecord] = await tx
					.insert(clearance)
					.values({
						department: department as 'finance' | 'library',
						status: 'pending',
					})
					.returning();

				await tx.insert(graduationClearance).values({
					graduationRequestId: request.id,
					clearanceId: clearanceRecord.id,
				});
			}

			try {
				await this.processAcademicClearance(tx, request.id, data.studentProgramId);
			} catch (error) {
				console.error('Error processing academic clearance:', error);
				const [academicClearanceRecord] = await tx
					.insert(clearance)
					.values({
						department: 'academic',
						status: 'pending',
						message: 'Error processing academic clearance automatically. Manual review required.',
					})
					.returning();

				await tx.insert(graduationClearance).values({
					graduationRequestId: request.id,
					clearanceId: academicClearanceRecord.id,
				});
			}

			return request;
		});
	}

	override async findById(id: number) {
		return db.query.graduationRequests.findFirst({
			where: eq(graduationRequests.id, id),
			with: {
				studentProgram: {
					with: {
						student: true,
						structure: {
							with: {
								program: true,
							},
						},
					},
				},
				paymentReceipts: true,
				graduationClearances: {
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

	async findByStudentProgramId(studentProgramId: number) {
		return db.query.graduationRequests.findFirst({
			where: eq(graduationRequests.studentProgramId, studentProgramId),
			with: {
				studentProgram: {
					with: {
						student: true,
						structure: {
							with: {
								program: true,
							},
						},
					},
				},
				paymentReceipts: true,
				graduationClearances: {
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

	async findByStudentNo(stdNo: number) {
		return db.query.graduationRequests.findMany({
			where: sql`EXISTS (
        SELECT 1 FROM student_programs sp
        WHERE sp.id = ${graduationRequests.studentProgramId}
        AND sp.std_no = ${stdNo}
      )`,
			with: {
				studentProgram: {
					with: {
						student: true,
						structure: {
							with: {
								program: true,
							},
						},
					},
				},
				paymentReceipts: true,
				graduationClearances: {
					with: {
						clearance: {
							with: {
								respondedBy: true,
							},
						},
					},
				},
			},
			orderBy: (g, { desc }) => [desc(g.id)],
		});
	}

	async selectStudentProgramForGraduation(stdNo: number): Promise<number | null> {
		// First priority: Completed programs with specific terms
		const completedProgram = await db.query.studentPrograms.findFirst({
			where: and(eq(studentPrograms.stdNo, stdNo), eq(studentPrograms.status, 'Completed')),
			with: {
				semesters: true,
			},
		});

		if (completedProgram) {
			// Check if any semester has the required terms
			const hasRequiredTerms = completedProgram.semesters.some((semester) =>
				['2025-02', '2024-07', '2024-02'].includes(semester.term)
			);

			if (hasRequiredTerms) {
				return completedProgram.id;
			}
		}

		// Second priority: Active programs
		const activeProgram = await db.query.studentPrograms.findFirst({
			where: and(eq(studentPrograms.stdNo, stdNo), eq(studentPrograms.status, 'Active')),
		});

		if (activeProgram) {
			return activeProgram.id;
		}

		// Final fallback: Any program (prioritize Completed, then Active)
		const fallbackProgram = await db.query.studentPrograms.findFirst({
			where: eq(studentPrograms.stdNo, stdNo),
			orderBy: (studentPrograms, { sql }) => [
				sql`CASE ${studentPrograms.status} WHEN 'Completed' THEN 1 WHEN 'Active' THEN 2 ELSE 3 END`,
				studentPrograms.id,
			],
		});

		return fallbackProgram?.id || null;
	}

	async getEligiblePrograms(stdNo: number) {
		return db.query.studentPrograms.findMany({
			where: and(
				eq(studentPrograms.stdNo, stdNo),
				sql`${studentPrograms.status} IN ('Active', 'Completed')`
			),
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
				semesters: true,
			},
			orderBy: (studentPrograms, { sql }) => [
				sql`CASE ${studentPrograms.status} WHEN 'Completed' THEN 1 WHEN 'Active' THEN 2 ELSE 3 END`,
				studentPrograms.id,
			],
		});
	}

	async createWithPaymentReceipts(data: {
		graduationRequestData: typeof graduationRequests.$inferInsert;
		paymentReceipts: Array<{
			paymentType: (typeof paymentType.enumValues)[number];
			receiptNo: string;
		}>;
	}) {
		return db.transaction(async (tx) => {
			const { graduationRequestData, paymentReceipts: receipts } = data;

			const [graduationRequest] = await tx
				.insert(graduationRequests)
				.values(graduationRequestData)
				.returning();

			for (const department of ['finance', 'library']) {
				const [clearanceRecord] = await tx
					.insert(clearance)
					.values({
						department: department as 'finance' | 'library',
						status: 'pending',
					})
					.returning();

				await tx.insert(graduationClearance).values({
					graduationRequestId: graduationRequest.id,
					clearanceId: clearanceRecord.id,
				});
			}

			try {
				await this.processAcademicClearance(
					tx,
					graduationRequest.id,
					graduationRequestData.studentProgramId
				);
			} catch (error) {
				console.error('Error processing academic clearance:', error);
				const [academicClearanceRecord] = await tx
					.insert(clearance)
					.values({
						department: 'academic',
						status: 'pending',
						message: 'Error processing academic clearance automatically. Manual review required.',
					})
					.returning();

				await tx.insert(graduationClearance).values({
					graduationRequestId: graduationRequest.id,
					clearanceId: academicClearanceRecord.id,
				});
			}

			if (receipts.length > 0) {
				const receiptValues = receipts.map((receipt) => ({
					...receipt,
					graduationRequestId: graduationRequest.id,
				}));

				await tx.insert(paymentReceipts).values(receiptValues);
			}

			return graduationRequest;
		});
	}

	private async processAcademicClearance(
		tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
		graduationRequestId: number,
		studentProgramId: number
	) {
		// Get the student program with student info
		const studentProgram = await tx.query.studentPrograms.findFirst({
			where: eq(studentPrograms.id, studentProgramId),
			with: {
				student: true,
			},
		});

		if (!studentProgram) {
			throw new Error('Student program not found');
		}

		const programs = await studentsService.getStudentPrograms(studentProgram.stdNo);
		if (!programs || programs.length === 0) {
			throw new Error('Student not found');
		}

		const selectedProgram = programs.find((p) => p.id === studentProgramId);
		if (!selectedProgram) {
			throw new Error('Selected program not found');
		}

		const outstanding = await getOutstandingFromStructure([selectedProgram]);

		let status: 'approved' | 'rejected' | 'pending';
		let message: string | undefined;

		if (outstanding.failedNeverRepeated.length === 0 && outstanding.neverAttempted.length === 0) {
			status = 'approved';
		} else {
			status = 'pending';
			const reasons = [];

			if (outstanding.failedNeverRepeated.length > 0) {
				const failedList = outstanding.failedNeverRepeated
					.map((m) => `${m.code} - ${m.name}`)
					.join(', ');
				reasons.push(`Failed modules never repeated: ${failedList}`);
			}

			if (outstanding.neverAttempted.length > 0) {
				const neverAttemptedList = outstanding.neverAttempted
					.map((m) => `${m.code} - ${m.name}`)
					.join(', ');
				reasons.push(`Required modules never attempted: ${neverAttemptedList}`);
			}

			message = `Academic requirements not met. ${reasons.join('; ')}. Please ensure all program modules are completed successfully before applying for graduation.`;
		}

		const [academicClearanceRecord] = await tx
			.insert(clearance)
			.values({
				department: 'academic',
				status,
				message,
			})
			.returning();

		await tx.insert(graduationClearance).values({
			graduationRequestId,
			clearanceId: academicClearanceRecord.id,
		});
	}

	async getClearanceData(graduationRequestId: number) {
		return db.query.graduationRequests.findFirst({
			where: eq(graduationRequests.id, graduationRequestId),
			with: {
				studentProgram: {
					with: {
						student: true,
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
				paymentReceipts: true,
				graduationClearances: {
					with: {
						clearance: true,
					},
				},
			},
		});
	}

	async countByStatus(status: 'pending' | 'approved' | 'rejected') {
		if (status === 'rejected') {
			// Count requests where ANY department has rejected clearance
			const [result] = await db
				.select({ value: sql`count(*)`.as<number>() })
				.from(graduationRequests)
				.where(
					sql`EXISTS (
            SELECT 1 FROM clearance c 
            INNER JOIN graduation_clearance gc ON c.id = gc.clearance_id 
            WHERE gc.graduation_request_id = ${graduationRequests.id} 
            AND c.status = 'rejected'
          )`
				);
			return result.value;
		} else if (status === 'approved') {
			// Count requests where ALL departments have approved clearance
			const [result] = await db
				.select({ value: sql`count(*)`.as<number>() })
				.from(graduationRequests)
				.where(
					and(
						// No rejected clearances
						sql`NOT EXISTS (
              SELECT 1 FROM clearance c 
              INNER JOIN graduation_clearance gc ON c.id = gc.clearance_id 
              WHERE gc.graduation_request_id = ${graduationRequests.id} 
              AND c.status = 'rejected'
            )`,
						// No pending clearances
						sql`NOT EXISTS (
              SELECT 1 FROM clearance c 
              INNER JOIN graduation_clearance gc ON c.id = gc.clearance_id 
              WHERE gc.graduation_request_id = ${graduationRequests.id} 
              AND c.status = 'pending'
            )`,
						// Has clearances (all should be approved)
						sql`EXISTS (
              SELECT 1 FROM graduation_clearance gc 
              WHERE gc.graduation_request_id = ${graduationRequests.id}
            )`
					)
				);
			return result.value;
		} else {
			// Count requests where ANY department has pending clearance (and none rejected)
			const [result] = await db
				.select({ value: sql`count(*)`.as<number>() })
				.from(graduationRequests)
				.where(
					and(
						// No rejected clearances
						sql`NOT EXISTS (
              SELECT 1 FROM clearance c 
              INNER JOIN graduation_clearance gc ON c.id = gc.clearance_id 
              WHERE gc.graduation_request_id = ${graduationRequests.id} 
              AND c.status = 'rejected'
            )`,
						// Has at least one pending clearance
						sql`EXISTS (
              SELECT 1 FROM clearance c 
              INNER JOIN graduation_clearance gc ON c.id = gc.clearance_id 
              WHERE gc.graduation_request_id = ${graduationRequests.id} 
              AND c.status = 'pending'
            )`
					)
				);
			return result.value;
		}
	}

	async findByStatus(
		status: 'pending' | 'approved' | 'rejected',
		params: QueryOptions<typeof graduationRequests>
	) {
		const { offset, limit } = this.buildQueryCriteria(params);

		let whereCondition: SQL | undefined;
		const searchCondition = params.search
			? sql`EXISTS (
          SELECT 1 FROM student_programs sp 
          INNER JOIN students s ON sp.std_no = s.std_no 
          WHERE sp.id = ${graduationRequests.studentProgramId} 
          AND (s.std_no LIKE ${`%${params.search}%`} OR s.name LIKE ${`%${params.search}%`})
        )`
			: undefined;

		if (status === 'rejected') {
			// Find requests where ANY department has rejected clearance
			whereCondition = and(
				sql`EXISTS (
          SELECT 1 FROM clearance c 
          INNER JOIN graduation_clearance gc ON c.id = gc.clearance_id 
          WHERE gc.graduation_request_id = ${graduationRequests.id} 
          AND c.status = 'rejected'
        )`,
				searchCondition
			);
		} else if (status === 'approved') {
			// Find requests where ALL departments have approved clearance
			whereCondition = and(
				// No rejected clearances
				sql`NOT EXISTS (
          SELECT 1 FROM clearance c 
          INNER JOIN graduation_clearance gc ON c.id = gc.clearance_id 
          WHERE gc.graduation_request_id = ${graduationRequests.id} 
          AND c.status = 'rejected'
        )`,
				// No pending clearances
				sql`NOT EXISTS (
          SELECT 1 FROM clearance c 
          INNER JOIN graduation_clearance gc ON c.id = gc.clearance_id 
          WHERE gc.graduation_request_id = ${graduationRequests.id} 
          AND c.status = 'pending'
        )`,
				// Has clearances (all should be approved)
				sql`EXISTS (
          SELECT 1 FROM graduation_clearance gc 
          WHERE gc.graduation_request_id = ${graduationRequests.id}
        )`,
				searchCondition
			);
		} else {
			// Find requests where ANY department has pending clearance (and none rejected)
			whereCondition = and(
				// No rejected clearances
				sql`NOT EXISTS (
          SELECT 1 FROM clearance c 
          INNER JOIN graduation_clearance gc ON c.id = gc.clearance_id 
          WHERE gc.graduation_request_id = ${graduationRequests.id} 
          AND c.status = 'rejected'
        )`,
				// Has at least one pending clearance
				sql`EXISTS (
          SELECT 1 FROM clearance c 
          INNER JOIN graduation_clearance gc ON c.id = gc.clearance_id 
          WHERE gc.graduation_request_id = ${graduationRequests.id} 
          AND c.status = 'pending'
        )`,
				searchCondition
			);
		}

		const query = db.query.graduationRequests.findMany({
			where: whereCondition,
			with: {
				studentProgram: {
					with: {
						student: true,
						structure: {
							with: {
								program: true,
							},
						},
					},
				},
			},
			limit,
			offset,
		});

		const [total, items] = await Promise.all([
			db
				.select({ value: sql`count(*)`.as<number>() })
				.from(graduationRequests)
				.where(whereCondition)
				.then((res) => res[0].value),
			query,
		]);

		return {
			data: items,
			pages: Math.ceil(total / limit),
		};
	}

	async findAllClearedStudents() {
		const clearedRequests = await db.query.graduationRequests.findMany({
			where: and(
				sql`NOT EXISTS (
          SELECT 1 FROM clearance c 
          INNER JOIN graduation_clearance gc ON c.id = gc.clearance_id 
          WHERE gc.graduation_request_id = ${graduationRequests.id} 
          AND c.status != 'approved'
        )`,
				sql`EXISTS (
          SELECT 1 FROM graduation_clearance gc 
          WHERE gc.graduation_request_id = ${graduationRequests.id}
        )`
			),
			with: {
				studentProgram: {
					with: {
						student: true,
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
		});

		return clearedRequests.map((request) => ({
			stdNo: request.studentProgram.student.stdNo,
			name: request.studentProgram.student.name,
			nationalId: request.studentProgram.student.nationalId,
			programCode: request.studentProgram.structure.program.code,
			programName: request.studentProgram.structure.program.name,
			level: request.studentProgram.structure.program.level,
			schoolName: request.studentProgram.structure.program.school.name,
		}));
	}
}

export const graduationRequestsRepository = new GraduationRequestRepository();
