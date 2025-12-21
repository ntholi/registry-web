import { and, eq, inArray } from 'drizzle-orm';
import { auth } from '@/core/auth';
import {
	assessmentMarks,
	assessmentMarksAudit,
	assessments,
	db,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

type Mark = typeof assessmentMarks.$inferSelect;

export default class AssessmentMarkRepository extends BaseRepository<
	typeof assessmentMarks,
	'id'
> {
	constructor() {
		super(assessmentMarks, assessmentMarks.id);
	}

	async findByModuleId(moduleId: number, termId: number) {
		const moduleAssessments = await db.query.assessments.findMany({
			where: and(
				eq(assessments.moduleId, moduleId),
				eq(assessments.termId, termId)
			),
			columns: {
				id: true,
			},
		});

		const assessmentIds = moduleAssessments.map((assessment) => assessment.id);

		if (assessmentIds.length === 0) {
			return [];
		}

		return db.query.assessmentMarks.findMany({
			where: inArray(assessmentMarks.assessmentId, assessmentIds),
			with: {
				assessment: true,
			},
		});
	}

	async findByModuleAndStudent(
		moduleId: number,
		stdNo: number,
		termId: number
	) {
		const moduleAssessments = await db.query.assessments.findMany({
			where: and(
				eq(assessments.moduleId, moduleId),
				eq(assessments.termId, termId)
			),
			columns: {
				id: true,
			},
		});

		const assessmentIds = moduleAssessments.map((assessment) => assessment.id);

		if (assessmentIds.length === 0) {
			return [];
		}

		return db.query.assessmentMarks.findMany({
			where: and(
				inArray(assessmentMarks.assessmentId, assessmentIds),
				eq(assessmentMarks.stdNo, stdNo)
			),
		});
	}

	async getAssessmentsByModuleId(moduleId: number, termId: number) {
		return db.query.assessments.findMany({
			where: and(
				eq(assessments.moduleId, moduleId),
				eq(assessments.termId, termId)
			),
		});
	}

	override async create(data: typeof assessmentMarks.$inferInsert) {
		const session = await auth();

		const inserted = await db.transaction(async (tx) => {
			if (!session?.user?.id) throw new Error('Unauthorized');

			const [mark] = await tx.insert(assessmentMarks).values(data).returning();
			await tx.insert(assessmentMarksAudit).values({
				assessmentMarkId: mark.id,
				action: 'create',
				previousMarks: null,
				newMarks: mark.marks,
				createdBy: session.user.id,
			});

			return mark;
		});

		return inserted;
	}
	override async update(
		id: number,
		data: Partial<typeof assessmentMarks.$inferInsert>
	) {
		const session = await auth();

		const updated = await db.transaction(async (tx) => {
			if (!session?.user?.id) throw new Error('Unauthorized');

			const current = await tx
				.select()
				.from(assessmentMarks)
				.where(eq(assessmentMarks.id, id))
				.limit(1)
				.then(([result]) => result);

			if (!current) throw new Error('Assessment mark not found');

			const [mark] = await tx
				.update(assessmentMarks)
				.set(data)
				.where(eq(assessmentMarks.id, id))
				.returning();

			if (data.marks !== undefined && data.marks !== current.marks) {
				await tx.insert(assessmentMarksAudit).values({
					assessmentMarkId: id,
					action: 'update',
					previousMarks: current.marks,
					newMarks: mark.marks,
					createdBy: session.user.id,
				});
			}

			return mark;
		});

		return updated;
	}

	override async delete(id: number): Promise<void> {
		const session = await auth();

		await db.transaction(async (tx) => {
			if (!session?.user?.id) throw new Error('Unauthorized');

			const current = await tx
				.select()
				.from(assessmentMarks)
				.where(eq(assessmentMarks.id, id))
				.limit(1)
				.then(([result]) => result);

			if (!current) throw new Error('Assessment mark not found');
			await tx.insert(assessmentMarksAudit).values({
				assessmentMarkId: id,
				action: 'delete',
				previousMarks: current.marks,
				newMarks: null,
				createdBy: session.user.id,
			});

			await tx.delete(assessmentMarks).where(eq(assessmentMarks.id, id));
		});
	}

	async getAuditHistory(assessmentMarkId: number) {
		return db.query.assessmentMarksAudit.findMany({
			where: eq(assessmentMarksAudit.assessmentMarkId, assessmentMarkId),
			with: {
				createdByUser: {
					columns: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: (audit, { desc }) => [desc(audit.date)],
		});
	}
	async createOrUpdateMarks(data: typeof assessmentMarks.$inferInsert) {
		const session = await auth();

		const result = await db.transaction(async (tx) => {
			if (!session?.user?.id) throw new Error('Unauthorized');
			const existing = await tx
				.select()
				.from(assessmentMarks)
				.where(
					and(
						eq(assessmentMarks.assessmentId, data.assessmentId),
						eq(assessmentMarks.stdNo, data.stdNo)
					)
				)
				.limit(1)
				.then(([result]) => result);

			if (existing) {
				const [updated] = await tx
					.update(assessmentMarks)
					.set({ marks: data.marks })
					.where(eq(assessmentMarks.id, existing.id))
					.returning();

				if (data.marks !== existing.marks) {
					await tx.insert(assessmentMarksAudit).values({
						assessmentMarkId: existing.id,
						action: 'update',
						previousMarks: existing.marks,
						newMarks: data.marks,
						createdBy: session.user.id,
					});
				}

				return { mark: updated, isNew: false };
			} else {
				const [created] = await tx
					.insert(assessmentMarks)
					.values(data)
					.returning();

				await tx.insert(assessmentMarksAudit).values({
					assessmentMarkId: created.id,
					action: 'create',
					previousMarks: null,
					newMarks: created.marks,
					createdBy: session.user.id,
				});

				return { mark: created, isNew: true };
			}
		});
		return result;
	}

	async createOrUpdateMarksInBulk(
		dataArray: (typeof assessmentMarks.$inferInsert)[],
		batchSize: number = 50
	) {
		const session = await auth();
		if (!session?.user?.id) throw new Error('Unauthorized');

		const userId = session.user.id;
		const results: {
			mark: Mark;
			isNew: boolean;
			stdNo: number;
		}[] = [];
		const processedStudents = new Set<number>();
		const errors: string[] = [];

		for (let i = 0; i < dataArray.length; i += batchSize) {
			const batch = dataArray.slice(i, i + batchSize);
			const batchResults: {
				mark: Mark;
				isNew: boolean;
				stdNo: number;
			}[] = [];
			const batchAuditEntries: (typeof assessmentMarksAudit.$inferInsert)[] =
				[];

			try {
				await db.transaction(async (tx) => {
					const assessmentIds = [
						...new Set(batch.map((data) => data.assessmentId)),
					];
					const stdNos = batch.map((data) => data.stdNo);

					const existingMarks = await tx
						.select()
						.from(assessmentMarks)
						.where(
							and(
								inArray(assessmentMarks.assessmentId, assessmentIds),
								inArray(assessmentMarks.stdNo, stdNos)
							)
						);

					const existingMarksMap = new Map(
						existingMarks.map((mark) => [
							`${mark.assessmentId}-${mark.stdNo}`,
							mark,
						])
					);

					const updatesData: {
						id: number;
						marks: number;
						existingMarks: number;
					}[] = [];
					const insertsData: (typeof assessmentMarks.$inferInsert)[] = [];

					for (const data of batch) {
						const key = `${data.assessmentId}-${data.stdNo}`;
						const existing = existingMarksMap.get(key);

						if (existing) {
							if (existing.marks !== data.marks) {
								updatesData.push({
									id: existing.id,
									marks: data.marks,
									existingMarks: existing.marks,
								});
							}
							batchResults.push({
								mark: { ...existing, marks: data.marks },
								isNew: false,
								stdNo: data.stdNo,
							});
						} else {
							insertsData.push(data);
						}
					}

					if (updatesData.length > 0) {
						for (const updateData of updatesData) {
							const [updated] = await tx
								.update(assessmentMarks)
								.set({ marks: updateData.marks })
								.where(eq(assessmentMarks.id, updateData.id))
								.returning();

							batchAuditEntries.push({
								assessmentMarkId: updateData.id,
								action: 'update',
								previousMarks: updateData.existingMarks,
								newMarks: updateData.marks,
								createdBy: userId,
							});

							const resultIndex = batchResults.findIndex(
								(r) => !r.isNew && r.mark.id === updateData.id
							);
							if (resultIndex !== -1) {
								batchResults[resultIndex].mark = updated;
							}
						}
					}

					if (insertsData.length > 0) {
						const insertedMarks = await tx
							.insert(assessmentMarks)
							.values(insertsData)
							.returning();

						for (const inserted of insertedMarks) {
							batchResults.push({
								mark: inserted,
								isNew: true,
								stdNo: inserted.stdNo,
							});

							batchAuditEntries.push({
								assessmentMarkId: inserted.id,
								action: 'create',
								previousMarks: null,
								newMarks: inserted.marks,
								createdBy: userId,
							});
						}
					}

					if (batchAuditEntries.length > 0) {
						await tx.insert(assessmentMarksAudit).values(batchAuditEntries);
					}
				});

				results.push(...batchResults);
				batchResults.forEach((result) => {
					processedStudents.add(result.stdNo);
				});
			} catch (error) {
				const batchStdNos = batch.map((data) => data.stdNo).join(', ');
				errors.push(
					`Failed to process batch with students ${batchStdNos}: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		}

		return {
			results,
			processedStudents: Array.from(processedStudents),
			errors,
			successful: results.length,
			failed: errors.length,
		};
	}

	async getStudentAuditHistory(stdNo: number) {
		const studentAssessmentMarks = await db
			.select({ id: assessmentMarks.id })
			.from(assessmentMarks)
			.where(eq(assessmentMarks.stdNo, stdNo));

		if (studentAssessmentMarks.length === 0) {
			return [];
		}

		const assessmentMarkIds = studentAssessmentMarks.map((mark) => mark.id);

		return db.query.assessmentMarksAudit.findMany({
			where: inArray(assessmentMarksAudit.assessmentMarkId, assessmentMarkIds),
			with: {
				createdByUser: {
					columns: {
						id: true,
						name: true,
						image: true,
					},
				},
				assessmentMark: {
					with: {
						assessment: {
							with: {
								module: {
									columns: {
										id: true,
										code: true,
										name: true,
									},
								},
								term: {
									columns: {
										id: true,
										code: true,
									},
								},
							},
						},
					},
				},
			},
			orderBy: (audit, { desc }) => [desc(audit.date)],
		});
	}
}

export const assessmentMarksRepository = new AssessmentMarkRepository();
