import { and, eq, inArray } from 'drizzle-orm';
import {
	assessmentMarks,
	assessments,
	db,
	studentModules,
	terms,
} from '@/core/database';
import BaseRepository, {
	type AuditOptions,
} from '@/core/platform/BaseRepository';

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
				studentModule: {
					columns: { id: true },
					with: {
						studentSemester: {
							columns: {},
							with: {
								studentProgram: {
									columns: { stdNo: true },
								},
							},
						},
					},
				},
			},
		});
	}

	async findByStudentModuleId(studentModuleId: number) {
		return db.query.assessmentMarks.findMany({
			where: eq(assessmentMarks.studentModuleId, studentModuleId),
			with: {
				assessment: {
					columns: { id: true, termId: true },
				},
			},
		});
	}

	async findByStudentModuleIdWithDetails(studentModuleId: number) {
		return db.query.assessmentMarks.findMany({
			where: eq(assessmentMarks.studentModuleId, studentModuleId),
			with: {
				assessment: {
					columns: {
						id: true,
						assessmentNumber: true,
						assessmentType: true,
						totalMarks: true,
						weight: true,
					},
				},
			},
		});
	}

	async getStudentMarks(studentModuleId: number) {
		const sm = await db.query.studentModules.findFirst({
			where: eq(studentModules.id, studentModuleId),
			with: {
				semesterModule: {
					columns: { moduleId: true },
				},
				studentSemester: {
					columns: { termCode: true },
				},
			},
		});

		if (!sm?.semesterModule?.moduleId) {
			return [];
		}

		const term = await db.query.terms.findFirst({
			where: eq(terms.code, sm.studentSemester.termCode),
			columns: { id: true },
		});

		if (!term) {
			return [];
		}

		const mid = sm.semesterModule.moduleId;
		const tid = term.id;

		const list = await db.query.assessments.findMany({
			where: and(eq(assessments.moduleId, mid), eq(assessments.termId, tid)),
			orderBy: (a, { asc }) => [asc(a.assessmentNumber)],
		});

		const marks = await db.query.assessmentMarks.findMany({
			where: eq(assessmentMarks.studentModuleId, studentModuleId),
		});

		const map = new Map(marks.map((m) => [m.assessmentId, m]));

		return list.map((a) => {
			const m = map.get(a.id);
			return {
				assessment: {
					id: a.id,
					assessmentNumber: a.assessmentNumber,
					assessmentType: a.assessmentType,
					totalMarks: a.totalMarks,
					weight: a.weight,
				},
				marks: m?.marks ?? null,
				id: m?.id ?? null,
			};
		});
	}

	async getAssessmentsByModuleId(moduleId: number, termId: number) {
		return db.query.assessments.findMany({
			where: and(
				eq(assessments.moduleId, moduleId),
				eq(assessments.termId, termId)
			),
			orderBy: (assessments, { asc }) => [asc(assessments.assessmentNumber)],
		});
	}

	override async create(
		data: typeof assessmentMarks.$inferInsert,
		audit?: AuditOptions
	) {
		const inserted = await db.transaction(async (tx) => {
			const [mark] = await tx.insert(assessmentMarks).values(data).returning();

			if (audit) {
				await this.writeAuditLog(
					tx,
					'INSERT',
					String(mark.id),
					null,
					mark,
					audit
				);
			}

			return mark;
		});

		return inserted;
	}
	override async update(
		id: number,
		data: Partial<typeof assessmentMarks.$inferInsert>,
		audit?: AuditOptions
	) {
		const updated = await db.transaction(async (tx) => {
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

			if (audit && data.marks !== undefined && data.marks !== current.marks) {
				await this.writeAuditLog(
					tx,
					'UPDATE',
					String(id),
					current,
					mark,
					audit
				);
			}

			return mark;
		});

		return updated;
	}

	override async delete(id: number, audit?: AuditOptions): Promise<void> {
		await db.transaction(async (tx) => {
			const current = await tx
				.select()
				.from(assessmentMarks)
				.where(eq(assessmentMarks.id, id))
				.limit(1)
				.then(([result]) => result);

			if (!current) throw new Error('Assessment mark not found');

			if (audit) {
				await this.writeAuditLog(
					tx,
					'DELETE',
					String(id),
					current,
					null,
					audit
				);
			}

			await tx.delete(assessmentMarks).where(eq(assessmentMarks.id, id));
		});
	}

	async createOrUpdateMarks(
		data: typeof assessmentMarks.$inferInsert,
		audit?: AuditOptions
	) {
		const result = await db.transaction(async (tx) => {
			const existing = await tx
				.select()
				.from(assessmentMarks)
				.where(
					and(
						eq(assessmentMarks.assessmentId, data.assessmentId),
						eq(assessmentMarks.studentModuleId, data.studentModuleId)
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

				if (audit && data.marks !== existing.marks) {
					await this.writeAuditLog(
						tx,
						'UPDATE',
						String(existing.id),
						existing,
						updated,
						audit
					);
				}

				return { mark: updated, isNew: false };
			}
			const [created] = await tx
				.insert(assessmentMarks)
				.values(data)
				.returning();

			if (audit) {
				await this.writeAuditLog(
					tx,
					'INSERT',
					String(created.id),
					null,
					created,
					audit
				);
			}

			return { mark: created, isNew: true };
		});
		return result;
	}

	async createOrUpdateMarksInBulk(
		dataArray: (typeof assessmentMarks.$inferInsert)[],
		audit?: AuditOptions,
		batchSize: number = 50
	) {
		const results: {
			mark: Mark;
			isNew: boolean;
			studentModuleId: number;
		}[] = [];
		const processedStudentModules = new Set<number>();
		const errors: string[] = [];

		for (let i = 0; i < dataArray.length; i += batchSize) {
			const batch = dataArray.slice(i, i + batchSize);
			const batchResults: {
				mark: Mark;
				isNew: boolean;
				studentModuleId: number;
			}[] = [];
			const auditEntries: Array<{
				operation: 'INSERT' | 'UPDATE' | 'DELETE';
				recordId: string;
				oldValues: unknown;
				newValues: unknown;
			}> = [];

			try {
				await db.transaction(async (tx) => {
					const assessmentIds = [
						...new Set(batch.map((data) => data.assessmentId)),
					];
					const studentModuleIds = batch.map((data) => data.studentModuleId);

					const existingMarks = await tx
						.select()
						.from(assessmentMarks)
						.where(
							and(
								inArray(assessmentMarks.assessmentId, assessmentIds),
								inArray(assessmentMarks.studentModuleId, studentModuleIds)
							)
						);

					const existingMarksMap = new Map(
						existingMarks.map((mark) => [
							`${mark.assessmentId}-${mark.studentModuleId}`,
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
						const key = `${data.assessmentId}-${data.studentModuleId}`;
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
								studentModuleId: data.studentModuleId,
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

							auditEntries.push({
								operation: 'UPDATE' as const,
								recordId: String(updateData.id),
								oldValues: {
									id: updateData.id,
									marks: updateData.existingMarks,
								},
								newValues: updated,
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
								studentModuleId: inserted.studentModuleId,
							});

							auditEntries.push({
								operation: 'INSERT',
								recordId: String(inserted.id),
								oldValues: null,
								newValues: inserted,
							});
						}
					}

					if (audit && auditEntries.length > 0) {
						await this.writeAuditLogBatch(tx, auditEntries, audit);
					}
				});

				results.push(...batchResults);
				for (const result of batchResults) {
					processedStudentModules.add(result.studentModuleId);
				}
			} catch (error) {
				const batchIds = batch.map((data) => data.studentModuleId).join(', ');
				errors.push(
					`Failed to process batch with studentModuleIds ${batchIds}: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		}

		return {
			results,
			processedStudentModules: Array.from(processedStudentModules),
			errors,
			successful: results.length,
			failed: errors.length,
		};
	}
}

export const assessmentMarksRepository = new AssessmentMarkRepository();
