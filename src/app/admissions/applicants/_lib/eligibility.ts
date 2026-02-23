import {
	type AcademicRecordForScoring,
	classificationRanks,
	filterRecognizedRecords,
	getBestClassification,
	getBestSubjectGrades,
	getHighestLqfLevel,
	getHighestLqfRecords,
	gradeRank,
	isGradeAtLeast,
	matchesCourse,
} from '@admissions/_lib/grading';
import type { StandardGrade } from '@admissions/academic-records/_schema/subjectGrades';
import type {
	ClassificationRules,
	EntryRequirementWithRelations,
	SubjectGradeRules,
} from '@admissions/entry-requirements/_lib/types';
import { normalizeSubjectGradeRules } from '@admissions/entry-requirements/_lib/types';
import type { RecognizedSchool } from '@admissions/recognized-schools/_lib/types';
import type { ApplicantWithRelations } from './types';

type EligibilityProgram = EntryRequirementWithRelations['program'];

type GradeMap = Map<string, StandardGrade>;

function meetsRequiredSubjects(
	subjects: SubjectGradeRules['subjects'],
	grades: GradeMap
) {
	const requiredSubjects = subjects.filter((subject) => subject.required);
	if (requiredSubjects.length === 0) return true;
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

function meetsGradeOption(
	option: SubjectGradeRules['gradeOptions'][number],
	grades: GradeMap
) {
	const gradeArray = Array.from(grades.values());
	const sortedReqs = [...option].sort(
		(a, b) => gradeRank(b.grade) - gradeRank(a.grade)
	);

	let availableGrades = [...gradeArray];

	for (const req of sortedReqs) {
		let found = 0;
		const usedIndices: number[] = [];
		for (let i = 0; i < availableGrades.length; i++) {
			if (isGradeAtLeast(availableGrades[i], req.grade)) {
				found++;
				usedIndices.push(i);
				if (found >= req.count) break;
			}
		}
		if (found < req.count) return false;
		availableGrades = availableGrades.filter(
			(_, i) => !usedIndices.includes(i)
		);
	}
	return true;
}

function meetsAnyGradeOption(
	gradeOptions: SubjectGradeRules['gradeOptions'],
	grades: GradeMap
) {
	if (gradeOptions.length === 0) return true;
	return gradeOptions.some((option) => meetsGradeOption(option, grades));
}

function meetsClassificationRule(
	rules: ClassificationRules,
	records: AcademicRecordForScoring[]
) {
	const relevant = records.filter((record) =>
		matchesCourse(record, rules.courses)
	);
	if (relevant.length === 0) return false;
	const best = getBestClassification(relevant);
	const effectiveBest = best ?? 'Pass';
	const minimum = rules.minimumClassification ?? 'Pass';
	return (
		(classificationRanks[effectiveBest] ?? -1) >=
		(classificationRanks[minimum] ?? -1)
	);
}

function meetsSubjectGradeRule(
	rules: SubjectGradeRules,
	records: AcademicRecordForScoring[]
): boolean {
	const grades = getBestSubjectGrades(records);
	return (
		meetsAnyGradeOption(rules.gradeOptions, grades) &&
		meetsRequiredSubjects(rules.subjects, grades) &&
		meetsOptionalGroups(rules.subjectGroups, grades)
	);
}

export function meetsEntryRules(
	rules: SubjectGradeRules | ClassificationRules,
	records: AcademicRecordForScoring[]
): boolean {
	if (rules.type === 'subject-grades') {
		const normalized = normalizeSubjectGradeRules(
			rules as Parameters<typeof normalizeSubjectGradeRules>[0]
		);
		return meetsSubjectGradeRule(normalized, records);
	}
	return meetsClassificationRule(rules, records);
}

export function getEligiblePrograms(
	academicRecords: ApplicantWithRelations['academicRecords'],
	requirements: EntryRequirementWithRelations[],
	recognizedSchools: RecognizedSchool[] = []
): EligibilityProgram[] {
	const highestLevel = getHighestLqfLevel(academicRecords);
	if (!highestLevel) return [];
	const highestRecords = getHighestLqfRecords(academicRecords);
	if (highestRecords.length === 0) return [];

	const isRecognitionRequired = highestLevel >= 5;
	const eligibleRecords = isRecognitionRequired
		? filterRecognizedRecords(highestRecords, recognizedSchools)
		: highestRecords;
	if (eligibleRecords.length === 0) return [];

	const eligiblePrograms = new Map<number, EligibilityProgram>();

	for (const requirement of requirements) {
		if (requirement.certificateType.lqfLevel !== highestLevel) continue;
		const records = eligibleRecords;
		const rules = requirement.rules as SubjectGradeRules | ClassificationRules;
		if (!meetsEntryRules(rules, records)) continue;
		eligiblePrograms.set(requirement.program.id, requirement.program);
	}

	return Array.from(eligiblePrograms.values()).sort((a, b) =>
		a.code.localeCompare(b.code)
	);
}
