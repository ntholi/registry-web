import type { grade } from '@/core/database';
import { getLetterGrade } from './grades';

export type GradeCalculation = {
	weightedTotal: number;
	grade: (typeof grade.enumValues)[number];
	hasMarks: boolean;
	hasPassed: boolean;
};

export function calculateModuleGrade<
	T extends { id: number; weight: number; totalMarks: number },
	M extends { assessmentId: number; marks: number },
>(assessments: T[], assessmentMarks: M[]): GradeCalculation {
	let totalWeight = 0;
	let weightedMarks = 0;
	let hasMarks = false;

	for (const assessment of assessments) {
		totalWeight += assessment.weight;

		const markRecord = assessmentMarks.find(
			(mark) => mark.assessmentId === assessment.id
		);

		if (markRecord && markRecord.marks !== undefined) {
			const percentage = markRecord.marks / assessment.totalMarks;
			weightedMarks += percentage * assessment.weight;
			hasMarks = true;
		}
	}
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
