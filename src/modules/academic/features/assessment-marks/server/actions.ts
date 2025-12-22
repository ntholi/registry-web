'use server';

import { updateGradeByStudentModuleId } from '@academic/semester-modules';
import { getCurrentTerm } from '@registry/dates/terms';
import type { assessmentMarks } from '@/core/database';
import { calculateModuleGrade } from '@/shared/lib/utils/gradeCalculations';
import { assessmentMarksService as service } from './service';

type AssessmentMark = typeof assessmentMarks.$inferInsert;

export async function getAssessmentMark(id: number) {
	return service.get(id);
}

export async function getAssessmentMarks(page: number = 1, search = '') {
	return service.getAll({ page, search });
}

export async function getAssessmentMarksByModuleId(moduleId: number) {
	const term = await getCurrentTerm();
	return service.getByModuleId(moduleId, term.id);
}

export async function getAssessmentMarksAuditHistory(assessmentMarkId: number) {
	return service.getAuditHistory(assessmentMarkId);
}

export async function createAssessmentMark(
	assessmentMark: AssessmentMark,
	moduleId: number
) {
	const result = await service.create(assessmentMark);
	await calculateAndSaveModuleGrade(moduleId, assessmentMark.studentModuleId);
	return result;
}

export async function createOrUpdateMarks(assessmentMark: AssessmentMark) {
	if (Number.isNaN(assessmentMark.marks)) {
		throw new Error('Mark is required');
	}
	return service.createOrUpdateMarks(assessmentMark);
}

export async function createOrUpdateMarksInBulk(
	assessmentMarks: AssessmentMark[],
	moduleId: number
) {
	const invalidMarks = assessmentMarks.filter((mark) =>
		Number.isNaN(mark.marks)
	);
	if (invalidMarks.length > 0) {
		throw new Error('All marks must be valid numbers');
	}

	const result = await service.createOrUpdateMarksInBulk(assessmentMarks);

	for (const studentModuleId of result.processedStudentModules) {
		try {
			await calculateAndSaveModuleGrade(moduleId, studentModuleId);
		} catch (error) {
			result.errors.push(
				`Failed to calculate grade for studentModuleId ${studentModuleId}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	return result;
}

export async function updateAssessmentMark(
	id: number,
	assessmentMark: AssessmentMark,
	moduleId: number
) {
	if (Number.isNaN(assessmentMark.marks)) {
		throw new Error('Mark is required');
	}

	const result = await service.update(id, assessmentMark);
	await calculateAndSaveModuleGrade(moduleId, assessmentMark.studentModuleId);
	return result;
}

export async function deleteAssessmentMark(id: number) {
	return service.delete(id);
}

export async function calculateAndSaveModuleGrade(
	moduleId: number,
	studentModuleId: number
) {
	const term = await getCurrentTerm();
	const assessments = await service.getAssessmentsByModuleId(moduleId, term.id);
	const assessmentMarks = await service.getByStudentModuleId(studentModuleId);

	if (!assessments || assessments.length === 0) {
		return null;
	}

	const gradeCalculation = calculateModuleGrade(
		assessments.map((a) => ({
			id: a.id,
			weight: a.weight,
			totalMarks: a.totalMarks,
		})),
		assessmentMarks.map((m) => ({
			assessment_id: m.assessmentId,
			marks: m.marks,
		}))
	);

	if (gradeCalculation.hasMarks) {
		await updateGradeByStudentModuleId(
			studentModuleId,
			gradeCalculation.grade,
			gradeCalculation.weightedTotal
		);
	}

	return gradeCalculation;
}

export async function getMarksAudit(studentModuleId: number) {
	return service.getStudentAuditHistory(studentModuleId);
}
