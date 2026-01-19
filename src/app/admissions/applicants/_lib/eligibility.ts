import type { StandardGrade } from '@admissions/academic-records/_schema/subjectGrades';
import type {
	ClassificationRules,
	EntryRequirementWithRelations,
	SubjectGradeRules,
} from '@admissions/entry-requirements/_lib/types';
import type { ApplicantWithRelations } from './types';

type AcademicRecord = ApplicantWithRelations['academicRecords'][number];

type EligibilityProgram = EntryRequirementWithRelations['program'];

type GradeMap = Map<string, StandardGrade>;

type ClassificationRank = 0 | 1 | 2 | 3 | 4;

type GradeRank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

const gradeRanks: Record<StandardGrade, GradeRank> = {
	'A*': 7,
	A: 6,
	B: 5,
	C: 4,
	D: 3,
	E: 2,
	F: 1,
	U: 0,
};

const classificationRanks: Record<string, ClassificationRank> = {
	Distinction: 4,
	Merit: 3,
	Credit: 2,
	Pass: 1,
	Fail: 0,
};

function getHighestLqfRecords(records: AcademicRecord[]) {
	if (records.length === 0) return [];
	const maxLqf = Math.max(
		...records.map((record) => record.certificateType.lqfLevel)
	);
	return records.filter((record) => record.certificateType.lqfLevel === maxLqf);
}

function getHighestLqfLevel(records: AcademicRecord[]) {
	if (records.length === 0) return null;
	return Math.max(...records.map((record) => record.certificateType.lqfLevel));
}

function gradeRank(grade: StandardGrade | string | null | undefined): number {
	if (!grade) return -1;
	const key = grade.toUpperCase() as StandardGrade;
	return gradeRanks[key] ?? -1;
}

function isGradeAtLeast(
	grade: StandardGrade | string | null | undefined,
	minimum: StandardGrade | string
) {
	return gradeRank(grade) >= gradeRank(minimum);
}

function getBestSubjectGrades(records: AcademicRecord[]): GradeMap {
	const best = new Map<string, StandardGrade>();
	for (const record of records) {
		for (const grade of record.subjectGrades) {
			const existing = best.get(grade.subjectId);
			if (!existing || gradeRank(grade.standardGrade) > gradeRank(existing)) {
				best.set(grade.subjectId, grade.standardGrade);
			}
		}
	}
	return best;
}

function meetsRequiredSubjects(
	requiredSubjects: SubjectGradeRules['requiredSubjects'],
	grades: GradeMap
) {
	return requiredSubjects.every((req) => {
		const grade = grades.get(req.subjectId);
		return isGradeAtLeast(grade, req.minimumGrade);
	});
}

function meetsOptionalGroups(
	groups: SubjectGradeRules['subjectGroups'] | undefined,
	grades: GradeMap
) {
	if (!groups || groups.length === 0) return true;
	return groups.every((group) => {
		if (!group.required) return true;
		return group.subjectIds.some((id) =>
			isGradeAtLeast(grades.get(id), group.minimumGrade)
		);
	});
}

function meetsMinimumPasses(
	minimumGrades: SubjectGradeRules['minimumGrades'],
	grades: GradeMap
) {
	const count = Array.from(grades.values()).filter((grade) =>
		isGradeAtLeast(grade, minimumGrades.grade)
	).length;
	return count >= minimumGrades.count;
}

function matchesQualificationName(
	record: AcademicRecord,
	required: string | undefined
) {
	if (!required) return true;
	if (!record.qualificationName) return false;
	return (
		record.qualificationName.trim().toLowerCase() ===
		required.trim().toLowerCase()
	);
}

function getBestClassification(records: AcademicRecord[]) {
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

function meetsClassificationRule(
	rules: ClassificationRules,
	records: AcademicRecord[]
) {
	const relevant = records.filter((record) =>
		matchesQualificationName(record, rules.requiredQualificationName)
	);
	if (relevant.length === 0) return false;
	const best = getBestClassification(relevant);
	if (!best) return false;
	return (
		(classificationRanks[best] ?? -1) >=
		(classificationRanks[rules.minimumClassification] ?? -1)
	);
}

function meetsSubjectGradeRule(
	rules: SubjectGradeRules,
	records: AcademicRecord[]
): boolean {
	const grades = getBestSubjectGrades(records);
	const basePass =
		meetsMinimumPasses(rules.minimumGrades, grades) &&
		meetsRequiredSubjects(rules.requiredSubjects, grades) &&
		meetsOptionalGroups(rules.subjectGroups, grades);
	if (basePass) return true;
	if (!rules.alternatives || rules.alternatives.length === 0) return false;
	return rules.alternatives.some((alternative) =>
		meetsSubjectGradeRule(alternative, records)
	);
}

function meetsEntryRules(
	rules: SubjectGradeRules | ClassificationRules,
	records: AcademicRecord[]
): boolean {
	if (rules.type === 'subject-grades') {
		return meetsSubjectGradeRule(rules, records);
	}
	return meetsClassificationRule(rules, records);
}

export function getEligiblePrograms(
	academicRecords: ApplicantWithRelations['academicRecords'],
	requirements: EntryRequirementWithRelations[]
): EligibilityProgram[] {
	const highestLevel = getHighestLqfLevel(academicRecords);
	if (!highestLevel) return [];
	const highestRecords = getHighestLqfRecords(academicRecords);
	if (highestRecords.length === 0) return [];

	const eligiblePrograms = new Map<number, EligibilityProgram>();

	for (const requirement of requirements) {
		if (requirement.certificateType.lqfLevel !== highestLevel) continue;
		const records = highestRecords;
		const rules = requirement.rules as SubjectGradeRules | ClassificationRules;
		if (!meetsEntryRules(rules, records)) continue;
		eligiblePrograms.set(requirement.program.id, requirement.program);
	}

	return Array.from(eligiblePrograms.values()).sort((a, b) =>
		a.code.localeCompare(b.code)
	);
}
