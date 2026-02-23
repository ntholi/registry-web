import {
	type AcademicRecordForScoring,
	classificationScores,
	filterRecognizedRecords,
	getBestClassification,
	getBestSubjectGrades,
	getHighestLqfLevel,
	getHighestLqfRecords,
	gradeRank,
	matchesCourse,
} from '@admissions/_lib/grading';
import { meetsEntryRules } from '@admissions/applicants/_lib/eligibility';
import type {
	ClassificationRules,
	SubjectGradeRules,
} from '@admissions/entry-requirements/_lib/types';
import { normalizeSubjectGradeRules } from '@admissions/entry-requirements/_lib/types';

type EntryRequirement = {
	programId: number;
	certificateType: { id: string; name: string; lqfLevel: number };
	rules: SubjectGradeRules | ClassificationRules;
};

type RecognizedSchool = { name: string };

export type ScoreResult = {
	overallScore: number | null;
	firstChoiceScore: number | null;
	secondChoiceScore: number | null;
};

export function calculateOverallScore(
	academicRecords: AcademicRecordForScoring[]
): number | null {
	const highestRecords = getHighestLqfRecords(academicRecords);
	if (highestRecords.length === 0) return null;

	const subjectScore = calculateSubjectAverage(highestRecords);
	const classScore = calculateClassificationScore(highestRecords);

	if (subjectScore !== null && classScore !== null) {
		return Math.max(subjectScore, classScore);
	}

	return subjectScore ?? classScore;
}

export function calculateProgramScore(
	academicRecords: AcademicRecordForScoring[],
	programId: number,
	entryRequirements: EntryRequirement[],
	recognizedSchools: RecognizedSchool[]
): number | null {
	const highestLevel = getHighestLqfLevel(academicRecords);
	if (!highestLevel) return null;

	const highestRecords = getHighestLqfRecords(academicRecords);
	if (highestRecords.length === 0) return null;

	const requirement = entryRequirements.find(
		(er) =>
			er.programId === programId && er.certificateType.lqfLevel === highestLevel
	);
	if (!requirement) return null;

	const isRecognitionRequired = highestLevel >= 5;
	const eligibleRecords = isRecognitionRequired
		? filterRecognizedRecords(highestRecords, recognizedSchools)
		: highestRecords;
	if (eligibleRecords.length === 0) return 0;

	const rules = requirement.rules;
	if (!meetsEntryRules(rules, eligibleRecords)) return 0;

	if (rules.type === 'subject-grades') {
		return calculateSubjectProgramScore(
			eligibleRecords,
			normalizeSubjectGradeRules(rules)
		);
	}

	return calculateClassificationProgramScore(eligibleRecords, rules);
}

export function calculateAllScores(
	academicRecords: AcademicRecordForScoring[],
	firstChoiceProgramId: number | null,
	secondChoiceProgramId: number | null,
	entryRequirements: EntryRequirement[],
	recognizedSchools: RecognizedSchool[]
): ScoreResult {
	const overallScore = calculateOverallScore(academicRecords);

	const firstChoiceScore = firstChoiceProgramId
		? calculateProgramScore(
				academicRecords,
				firstChoiceProgramId,
				entryRequirements,
				recognizedSchools
			)
		: null;

	const secondChoiceScore = secondChoiceProgramId
		? calculateProgramScore(
				academicRecords,
				secondChoiceProgramId,
				entryRequirements,
				recognizedSchools
			)
		: null;

	return { overallScore, firstChoiceScore, secondChoiceScore };
}

function calculateSubjectAverage(
	records: AcademicRecordForScoring[]
): number | null {
	const grades = getBestSubjectGrades(records);
	if (grades.size === 0) return null;

	let total = 0;
	for (const grade of grades.values()) {
		total += gradeRank(grade);
	}
	return total / grades.size;
}

function calculateClassificationScore(
	records: AcademicRecordForScoring[]
): number | null {
	const best = getBestClassification(records);
	if (!best) return null;
	return classificationScores[best] ?? null;
}

function calculateSubjectProgramScore(
	records: AcademicRecordForScoring[],
	rules: SubjectGradeRules
): number | null {
	const allGrades = getBestSubjectGrades(records);

	const relevantSubjectIds = new Set<string>();

	for (const subject of rules.subjects) {
		relevantSubjectIds.add(subject.subjectId);
	}

	if (rules.subjectGroups) {
		for (const group of rules.subjectGroups) {
			for (const id of group.subjectIds) {
				relevantSubjectIds.add(id);
			}
		}
	}

	if (relevantSubjectIds.size === 0) {
		return calculateSubjectAverage(records);
	}

	let total = 0;
	let count = 0;
	for (const subjectId of relevantSubjectIds) {
		const grade = allGrades.get(subjectId);
		if (grade) {
			total += gradeRank(grade);
			count++;
		}
	}

	if (count === 0) return null;
	return total / count;
}

function calculateClassificationProgramScore(
	records: AcademicRecordForScoring[],
	rules: ClassificationRules
): number | null {
	const relevant = records.filter((r) => matchesCourse(r, rules.courses));
	if (relevant.length === 0) return null;

	const best = getBestClassification(relevant);
	if (!best) {
		return classificationScores.Pass ?? null;
	}

	return classificationScores[best] ?? null;
}
