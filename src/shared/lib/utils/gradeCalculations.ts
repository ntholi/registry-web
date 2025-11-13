import type { grade } from '@/core/database/schema';
import { getLetterGrade } from './grades';

export type GradeCalculation = {
	weightedTotal: number;
	grade: (typeof grade.enumValues)[number];
	hasMarks: boolean;
	hasPassed: boolean;
};

export function calculateModuleGrade(
	assessments: Array<{
		id: number;
		weight: number;
		totalMarks: number;
	}>,
	assessmentMarks: Array<{
		assessment_id: number;
		marks: number;
	}>
): GradeCalculation {
	let totalWeight = 0;
	let weightedMarks = 0;
	let hasMarks = false;

	assessments.forEach((assessment) => {
		totalWeight += assessment.weight;

		const markRecord = assessmentMarks.find(
			(mark) => mark.assessment_id === assessment.id
		);

		if (markRecord && markRecord.marks !== undefined) {
			const percentage = markRecord.marks / assessment.totalMarks;
			weightedMarks += percentage * assessment.weight;
			hasMarks = true;
		}
	});
	const weightedTotal = Math.round(weightedMarks);
	const grade = getLetterGrade(weightedTotal);
	const hasPassed = weightedTotal >= totalWeight * 0.5;

	return {
		weightedTotal,
		grade,
		hasMarks,
		hasPassed,
	};
}
