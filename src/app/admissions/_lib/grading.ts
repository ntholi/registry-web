import type { StandardGrade } from '@admissions/academic-records/_schema/subjectGrades';

type GradeRank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

type ClassificationRank = 0 | 1 | 2 | 3 | 4;

export const gradeRanks: Record<StandardGrade, GradeRank> = {
	'A*': 7,
	A: 6,
	B: 5,
	C: 4,
	D: 3,
	E: 2,
	F: 1,
	U: 0,
};

export const classificationRanks: Record<string, ClassificationRank> = {
	Distinction: 4,
	Merit: 3,
	Credit: 2,
	Pass: 1,
	Fail: 0,
};

export const classificationScores: Record<string, number> = {
	Distinction: 7.0,
	Merit: 5.25,
	Credit: 3.5,
	Pass: 1.75,
	Fail: 0,
};

export type AcademicRecordForScoring = {
	certificateType: { id: string; name: string; lqfLevel: number };
	institutionName: string;
	qualificationName: string | null;
	resultClassification: string | null;
	subjectGrades: {
		subjectId: string;
		standardGrade: StandardGrade | null;
		subject: { id: string; name: string };
	}[];
};

type GradeMap = Map<string, StandardGrade>;

export function gradeRank(
	grade: StandardGrade | string | null | undefined
): number {
	if (!grade) return -1;
	const key = grade.toUpperCase() as StandardGrade;
	return gradeRanks[key] ?? -1;
}

export function isGradeAtLeast(
	grade: StandardGrade | string | null | undefined,
	minimum: StandardGrade | string
) {
	return gradeRank(grade) >= gradeRank(minimum);
}

export function getHighestLqfRecords<
	T extends { certificateType: { lqfLevel: number } },
>(records: T[]): T[] {
	if (records.length === 0) return [];
	const maxLqf = Math.max(
		...records.map((record) => record.certificateType.lqfLevel)
	);
	return records.filter((record) => record.certificateType.lqfLevel === maxLqf);
}

export function getHighestLqfLevel<
	T extends { certificateType: { lqfLevel: number } },
>(records: T[]): number | null {
	if (records.length === 0) return null;
	return Math.max(...records.map((record) => record.certificateType.lqfLevel));
}

export function getBestSubjectGrades(
	records: AcademicRecordForScoring[]
): GradeMap {
	const best = new Map<string, StandardGrade>();
	for (const record of records) {
		for (const grade of record.subjectGrades) {
			if (!grade.standardGrade) continue;
			const existing = best.get(grade.subjectId);
			if (!existing || gradeRank(grade.standardGrade) > gradeRank(existing)) {
				best.set(grade.subjectId, grade.standardGrade);
			}
		}
	}
	return best;
}

export function getBestClassification(records: AcademicRecordForScoring[]) {
	let best: string | null = null;
	let bestRank = -1;
	for (const record of records) {
		const rank = classificationRanks[record.resultClassification || ''] ?? -1;
		if (rank > bestRank) {
			bestRank = rank;
			best = record.resultClassification || null;
		}
	}
	return best;
}

export function filterRecognizedRecords<T extends { institutionName: string }>(
	records: T[],
	recognizedSchools: { name: string }[]
): T[] {
	const normalizedRecognized = recognizedSchools.map((school) =>
		school.name.trim().toLowerCase()
	);
	if (normalizedRecognized.length === 0) return [];

	return records.filter((record) => {
		const normalizedRecord = record.institutionName.trim().toLowerCase();
		return normalizedRecognized.some(
			(recognized) =>
				normalizedRecord === recognized ||
				normalizedRecord.startsWith(recognized)
		);
	});
}

export function matchesCourse(
	record: AcademicRecordForScoring,
	courses: string[]
) {
	if (courses.length === 0) return false;
	if (!record.qualificationName) return false;
	const recordCourse = record.qualificationName.trim().toLowerCase();
	return courses.some((course) => course.trim().toLowerCase() === recordCourse);
}
