'use server';

import { updateGradeByStudentModuleId } from '@academic/semester-modules';
import { getActiveTerm } from '@/app/registry/terms';
import type { assessmentMarks } from '@/core/database';
import { createAction, unwrap } from '@/shared/lib/actions/actionResult';
import { calculateModuleGrade } from '@/shared/lib/utils/gradeCalculations';
import { assessmentMarksService as service } from './service';

type AssessmentMark = typeof assessmentMarks.$inferInsert;

export async function getAssessmentMarksByModuleId(moduleId: number) {
	const term = await getActiveTerm();
	return service.getByModuleId(moduleId, term.id);
}

export const createAssessmentMark = createAction(
	async (assessmentMark: AssessmentMark, moduleId: number) => {
		const result = await service.create(assessmentMark);
		unwrap(
			await calculateAndSaveModuleGrade(
				moduleId,
				assessmentMark.studentModuleId
			)
		);
		return result;
	}
);

export const createOrUpdateMarksInBulk = createAction(
	async (assessmentMarks: AssessmentMark[], moduleId: number) => {
		const invalidMarks = assessmentMarks.filter((mark) =>
			Number.isNaN(mark.marks)
		);
		if (invalidMarks.length > 0) {
			throw new Error('All marks must be valid numbers');
		}

		const result = await service.createOrUpdateMarksInBulk(assessmentMarks);

		for (const studentModuleId of result.processedStudentModules) {
			try {
				unwrap(await calculateAndSaveModuleGrade(moduleId, studentModuleId));
			} catch (error) {
				result.errors.push(
					`Failed to calculate grade for studentModuleId ${studentModuleId}: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		}

		return result;
	}
);

export const updateAssessmentMark = createAction(
	async (id: number, assessmentMark: AssessmentMark, moduleId: number) => {
		if (Number.isNaN(assessmentMark.marks)) {
			throw new Error('Mark is required');
		}

		const result = await service.update(id, assessmentMark);
		unwrap(
			await calculateAndSaveModuleGrade(
				moduleId,
				assessmentMark.studentModuleId
			)
		);
		return result;
	}
);

export const calculateAndSaveModuleGrade = createAction(
	async (moduleId: number, studentModuleId: number) => {
		const term = await getActiveTerm();
		const assessments = await service.getAssessmentsByModuleId(
			moduleId,
			term.id
		);
		const assessmentMarks = await service.getByStudentModuleId(studentModuleId);

		if (!assessments || assessments.length === 0) {
			return null;
		}

		const gradeCalculation = calculateModuleGrade(assessments, assessmentMarks);

		if (gradeCalculation.hasMarks) {
			unwrap(
				await updateGradeByStudentModuleId(
					studentModuleId,
					gradeCalculation.grade,
					gradeCalculation.weightedTotal
				)
			);
		}

		return gradeCalculation;
	}
);

export async function getMarksAudit(studentModuleId: number) {
	return service.getStudentAuditHistory(studentModuleId);
}

export async function getStudentMarks(smId: number) {
	return service.getStudentMarks(smId);
}
