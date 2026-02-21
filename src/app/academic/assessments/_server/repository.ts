import { and, eq, inArray } from 'drizzle-orm';
import { auth } from '@/core/auth';
import {
	assessmentMarks,
	assessments,
	assessmentsAudit,
	db,
	lmsAssessments,
	studentModules,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
import { calculateModuleGrade } from '@/shared/lib/utils/gradeCalculations';

export default class AssessmentRepository extends BaseRepository<
	typeof assessments,
	'id'
> {
	constructor() {
		super(assessments, assessments.id);
	}

	override async findById(id: number) {
		return db.query.assessments.findFirst({
			where: eq(assessments.id, id),
			with: {
				lmsAssessment: true,
			},
		});
	}

	async findByLmsId(lmsId: number) {
		const lmsAssessment = await db.query.lmsAssessments.findFirst({
			where: eq(lmsAssessments.lmsId, lmsId),
			with: {
				assessment: {
					with: {
						lmsAssessment: true,
					},
				},
			},
		});
		return lmsAssessment?.assessment;
	}

	async getByModuleId(moduleId: number, termId: number) {
		return db.query.assessments.findMany({
			where: and(
				eq(assessments.moduleId, moduleId),
				eq(assessments.termId, termId)
			),
			orderBy: (assessments, { asc }) => [asc(assessments.assessmentNumber)],
		});
	}

	async createWithLms(
		data: typeof assessments.$inferInsert,
		lmsData?: Omit<typeof lmsAssessments.$inferInsert, 'assessmentId'>
	) {
		const session = await auth();

		const inserted = await db.transaction(async (tx) => {
			if (!session?.user?.id) throw new Error('Unauthorized');

			const [assessment] = await tx
				.insert(assessments)
				.values(data)
				.returning();
			await tx.insert(assessmentsAudit).values({
				assessmentId: assessment.id,
				action: 'create',
				previousAssessmentNumber: null,
				newAssessmentNumber: assessment.assessmentNumber,
				previousAssessmentType: null,
				newAssessmentType: assessment.assessmentType,
				previousTotalMarks: null,
				newTotalMarks: assessment.totalMarks,
				previousWeight: null,
				newWeight: assessment.weight,
				createdBy: session.user.id,
			});

			if (lmsData) {
				await tx.insert(lmsAssessments).values({
					...lmsData,
					assessmentId: assessment.id,
				});
			}

			return assessment;
		});

		return inserted;
	}

	override async delete(id: number): Promise<void> {
		const session = await auth();

		await db.transaction(async (tx) => {
			if (!session?.user?.id) throw new Error('Unauthorized');

			const current = await tx
				.select()
				.from(assessments)
				.where(eq(assessments.id, id))
				.limit(1)
				.then(([result]) => result);

			if (!current) throw new Error('Assessment not found');

			await tx.insert(assessmentsAudit).values({
				assessmentId: id,
				action: 'delete',
				previousAssessmentNumber: current.assessmentNumber,
				newAssessmentNumber: null,
				previousAssessmentType: current.assessmentType,
				newAssessmentType: null,
				previousTotalMarks: current.totalMarks,
				newTotalMarks: null,
				previousWeight: current.weight,
				newWeight: null,
				createdBy: session.user.id,
			});

			await tx.delete(assessments).where(eq(assessments.id, id));
		});
	}

	async getAuditHistory(assessmentId: number) {
		return db.query.assessmentsAudit.findMany({
			where: eq(assessmentsAudit.assessmentId, assessmentId),
			with: {
				createdByUser: {
					columns: {
						id: true,
						name: true,
						image: true,
					},
				},
			},
			orderBy: (audit, { desc }) => [desc(audit.date)],
		});
	}

	async updateWithGradeRecalculation(
		id: number,
		data: Partial<typeof assessments.$inferInsert>,
		lmsData?: Partial<Omit<typeof lmsAssessments.$inferInsert, 'assessmentId'>>
	) {
		const session = await auth();

		const updated = await db.transaction(async (tx) => {
			if (!session?.user?.id) throw new Error('Unauthorized');

			const current = await tx
				.select()
				.from(assessments)
				.where(eq(assessments.id, id))
				.limit(1)
				.then(([result]) => result);

			if (!current) throw new Error('Assessment not found');

			const [assessment] = await tx
				.update(assessments)
				.set(data)
				.where(eq(assessments.id, id))
				.returning();

			const hasChanges =
				(data.assessmentNumber !== undefined &&
					data.assessmentNumber !== current.assessmentNumber) ||
				(data.assessmentType !== undefined &&
					data.assessmentType !== current.assessmentType) ||
				(data.totalMarks !== undefined &&
					data.totalMarks !== current.totalMarks) ||
				(data.weight !== undefined && data.weight !== current.weight);

			if (hasChanges) {
				await tx.insert(assessmentsAudit).values({
					assessmentId: id,
					action: 'update',
					previousAssessmentNumber: current.assessmentNumber,
					newAssessmentNumber: assessment.assessmentNumber,
					previousAssessmentType: current.assessmentType,
					newAssessmentType: assessment.assessmentType,
					previousTotalMarks: current.totalMarks,
					newTotalMarks: assessment.totalMarks,
					previousWeight: current.weight,
					newWeight: assessment.weight,
					createdBy: session.user.id,
				});
			}

			if (lmsData) {
				await tx
					.update(lmsAssessments)
					.set(lmsData)
					.where(eq(lmsAssessments.assessmentId, id));
			}

			const needsGradeRecalculation =
				(data.totalMarks !== undefined &&
					data.totalMarks !== current.totalMarks) ||
				(data.weight !== undefined && data.weight !== current.weight);

			if (needsGradeRecalculation) {
				const affectedMarks = await tx
					.selectDistinct({ studentModuleId: assessmentMarks.studentModuleId })
					.from(assessmentMarks)
					.where(eq(assessmentMarks.assessmentId, id));

				if (affectedMarks.length > 0) {
					const studentModuleIds = affectedMarks.map((m) => m.studentModuleId);

					const moduleAssessments = await tx.query.assessments.findMany({
						where: and(
							eq(assessments.moduleId, assessment.moduleId),
							eq(assessments.termId, assessment.termId)
						),
					});

					const allMarks = await tx.query.assessmentMarks.findMany({
						where: inArray(assessmentMarks.studentModuleId, studentModuleIds),
					});

					const marksByStudent = new Map<number, typeof allMarks>();
					for (const mark of allMarks) {
						const existing = marksByStudent.get(mark.studentModuleId) || [];
						existing.push(mark);
						marksByStudent.set(mark.studentModuleId, existing);
					}

					for (const studentModuleId of studentModuleIds) {
						const studentMarks = marksByStudent.get(studentModuleId) || [];

						const gradeCalculation = calculateModuleGrade(
							moduleAssessments,
							studentMarks
						);

						if (gradeCalculation.hasMarks) {
							await tx
								.update(studentModules)
								.set({
									grade: gradeCalculation.grade,
									marks: gradeCalculation.weightedTotal.toString(),
								})
								.where(eq(studentModules.id, studentModuleId));
						}
					}
				}
			}

			return assessment;
		});

		return updated;
	}
}

export const assessmentsRepository = new AssessmentRepository();
