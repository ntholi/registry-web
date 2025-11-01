import type { Grade, grade } from '@/db/schema';
import { getVisibleModulesForStructure } from '@/server/semester-modules/actions';
import type {
	FacultyRemarksResult,
	GradePoint,
	Program,
	StudentModule,
} from './type';

export type GradeDefinition = {
	grade: (typeof grade.enumValues)[number];
	points: number | null;
	description: string;
	marksRange?: {
		min: number;
		max: number;
	};
};

export const grades: GradeDefinition[] = [
	{
		grade: 'A+',
		points: 4.0,
		description: 'Pass with Distinction',
		marksRange: { min: 90, max: 100 },
	},
	{
		grade: 'A',
		points: 4.0,
		description: 'Pass with Distinction',
		marksRange: { min: 85, max: 89 },
	},
	{
		grade: 'A-',
		points: 4.0,
		description: 'Pass with Distinction',
		marksRange: { min: 80, max: 84 },
	},
	{
		grade: 'B+',
		points: 3.67,
		description: 'Pass with Merit',
		marksRange: { min: 75, max: 79 },
	},
	{
		grade: 'B',
		points: 3.33,
		description: 'Pass with Merit',
		marksRange: { min: 70, max: 74 },
	},
	{
		grade: 'B-',
		points: 3.0,
		description: 'Pass with Merit',
		marksRange: { min: 65, max: 69 },
	},
	{
		grade: 'C+',
		points: 2.67,
		description: 'Pass',
		marksRange: { min: 60, max: 64 },
	},
	{
		grade: 'C',
		points: 2.33,
		description: 'Pass',
		marksRange: { min: 55, max: 59 },
	},
	{
		grade: 'C-',
		points: 2.0,
		description: 'Pass',
		marksRange: { min: 50, max: 54 },
	},
	{
		grade: 'PP',
		points: 0.0,
		description: 'Pass Provisional',
		marksRange: { min: 45, max: 49 },
	},
	{
		grade: 'F',
		points: 0.0,
		description: 'Fail',
		marksRange: { min: 0, max: 49 },
	},
	{
		grade: 'PC',
		points: 2.0,
		description: 'Pass Conceded',
	},
	{
		grade: 'PX',
		points: 2.0,
		description: 'Pass (Supplementary Work Submitted)',
	},
	{
		grade: 'EXP',
		points: null,
		description: 'Exempted',
	},
	{
		grade: 'AP',
		points: 2.0,
		description: 'Aegrotat Pass',
	},
	{
		grade: 'X',
		points: 0.0,
		description: 'Outstanding Supplementary Assessment',
	},
	{
		grade: 'DEF',
		points: null,
		description: 'Deferred',
	},
	{
		grade: 'GNS',
		points: 0.0,
		description: 'Grade Not Submitted',
	},
	{
		grade: 'ANN',
		points: 0.0,
		description: 'Result Annulled Due To Misconduct',
	},
	{
		grade: 'FIN',
		points: 0.0,
		description: 'Fail Incomplete',
	},
	{
		grade: 'FX',
		points: 0.0,
		description: 'Fail (supplementary work submitted)',
	},
	{
		grade: 'DNC',
		points: 0.0,
		description: 'Did Not Complete',
	},
	{
		grade: 'DNA',
		points: 0.0,
		description: 'Did Not Attend',
	},
	{
		grade: 'PP',
		points: 0.0,
		description: 'Pending',
	},
	{
		grade: 'DNS',
		points: 0.0,
		description: 'Did Not Submit',
	},
	{
		grade: 'NM',
		points: null,
		description: 'No Mark',
	},
];

export function normalizeGradeSymbol(grade: string): string {
	return grade.trim().toUpperCase();
}

export function normalizeModuleName(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/\b(i{1,3}|iv|v|vi{0,3}|ix|x)\b/g, (match) => {
			// Convert roman numerals to arabic numbers
			const romanToArabic: { [key: string]: string } = {
				i: '1',
				ii: '2',
				iii: '3',
				iv: '4',
				v: '5',
				vi: '6',
				vii: '7',
				viii: '8',
				ix: '9',
				x: '10',
			};
			return romanToArabic[match.toLowerCase()] || match;
		})
		.replace(/\s+/g, ' ')
		.trim();
}

export function getGradeBySymbol(grade: string): GradeDefinition | undefined {
	return grades.find((g) => g.grade === normalizeGradeSymbol(grade));
}

export function getGradeByPoints(points: number): GradeDefinition | undefined {
	const gradesWithPoints = grades.filter((g) => g.points !== null);
	const sortedGrades = gradesWithPoints.sort(
		(a, b) => (b.points as number) - (a.points as number)
	);
	for (const grade of sortedGrades) {
		if (points >= (grade.points as number)) {
			return grade;
		}
	}
	return sortedGrades[sortedGrades.length - 1];
}

export function getGradeByMarks(marks: number): GradeDefinition | undefined {
	return grades.find(
		(g) =>
			g.marksRange && marks >= g.marksRange.min && marks <= g.marksRange.max
	);
}

export function getLetterGrade(marks: number): Grade {
	const gradeDefinition = getGradeByMarks(marks);
	return gradeDefinition?.grade || 'F';
}

export function getGradePoints(grade: string): number {
	const gradeDefinition = getGradeBySymbol(grade);
	return gradeDefinition?.points ?? 0;
}

export function isFailingGrade(grade: string): boolean {
	return ['F', 'X', 'GNS', 'ANN', 'FIN', 'FX', 'DNC', 'DNA', 'DNS'].includes(
		normalizeGradeSymbol(grade)
	);
}

export function isPassingGrade(grade: string): boolean {
	const passingGrades = grades
		.filter((g) => g.points !== null && g.points > 0)
		.map((g) => g.grade as string);
	return passingGrades.includes(normalizeGradeSymbol(grade));
}

export function isSupplementaryGrade(grade: string): boolean {
	return normalizeGradeSymbol(grade) === 'PP';
}

export function isFailingOrSupGrade(grade: string): boolean {
	return isFailingGrade(grade) || isSupplementaryGrade(grade);
}

export function summarizeModules(modules: StudentModule[]) {
	const relevant = modules.filter(
		(m) => !['Delete', 'Drop'].includes(m.status ?? '')
	);
	let points = 0;
	let creditsAttempted = 0;
	let creditsForGPA = 0;
	const creditsCompleted = relevant.reduce((sum, m) => {
		const normalizedGrade = normalizeGradeSymbol(m.grade);
		if (normalizedGrade === 'NM' || normalizedGrade === '') {
			return sum;
		}
		const gradePoints = getGradePoints(m.grade);
		return gradePoints > 0 ? sum + m.semesterModule.credits : sum;
	}, 0);
	relevant.forEach((m) => {
		const normalizedGrade = normalizeGradeSymbol(m.grade);
		const gradePoints = getGradePoints(m.grade);
		const gradeDefinition = getGradeBySymbol(m.grade);
		creditsAttempted += m.semesterModule.credits;
		if (normalizedGrade !== 'NM' && normalizedGrade !== '') {
			creditsForGPA += m.semesterModule.credits;
			if (gradeDefinition && gradeDefinition.points !== null) {
				points += gradePoints * m.semesterModule.credits;
			}
		}
	});
	return {
		points,
		creditsAttempted,
		creditsCompleted,
		gpa: calculateGPA(points, creditsForGPA),
		isNoMarks: false,
	};
}

function calculateGPA(points: number, creditsForGPA: number) {
	return creditsForGPA > 0 ? points / creditsForGPA : 0;
}

export function getAcademicRemarks(programs: Program[]): FacultyRemarksResult {
	const { semesters, studentModules } = extractData(programs);

	const points: GradePoint[] = [];
	let cumulativePoints = 0;
	let cumulativeCreditsForGPA = 0;

	for (const semester of semesters) {
		const semesterSummary = summarizeModules(semester.studentModules);
		cumulativePoints += semesterSummary.points;

		const semesterCreditsForGPA = semester.studentModules
			.filter((sm) => !['Delete', 'Drop'].includes(sm.status || ''))
			.filter((sm) => sm.grade && sm.grade !== 'NM')
			.reduce((sum, sm) => sum + Number(sm.semesterModule.credits), 0);

		cumulativeCreditsForGPA += semesterCreditsForGPA;

		const cgpa = calculateGPA(cumulativePoints, cumulativeCreditsForGPA);

		points.push({
			semesterId: semester.id,
			gpa: Number(semesterSummary.gpa),
			cgpa: Number(cgpa),
			creditsAttempted: semesterSummary.creditsAttempted,
			creditsCompleted: semesterSummary.creditsCompleted,
		});
	}

	const totalCreditsAttempted = points.reduce(
		(sum, point) => sum + point.creditsAttempted,
		0
	);

	const totalCreditsCompleted = points.reduce(
		(sum, point) => sum + point.creditsCompleted,
		0
	);

	if (studentModules.some((m) => m.grade === 'NM')) {
		return {
			status: 'No Marks',
			failedModules: [],
			supplementaryModules: [],
			message: 'No Marks',
			details: 'One or more modules have no marks captured',
			totalModules: 0,
			totalCreditsAttempted,
			totalCreditsCompleted,
			points,
			latestPoints: points[points.length - 1] || {
				semesterId: 0,
				gpa: 0,
				cgpa: 0,
				creditsAttempted: 0,
				creditsCompleted: 0,
			},
		};
	}

	const latestFailedModules =
		semesters.length > 0
			? semesters[semesters.length - 1].studentModules.filter((m) =>
					isFailingGrade(m.grade)
				)
			: [];
	const failedModules = studentModules.filter((m) => {
		if (!isFailingOrSupGrade(m.grade)) return false;

		const hasPassedLater = studentModules.some(
			(otherModule) =>
				otherModule.semesterModule.module?.name ===
					m.semesterModule.module?.name &&
				otherModule.id !== m.id &&
				isPassingGrade(otherModule.grade)
		);

		return !hasPassedLater;
	});

	const supplementary = studentModules.filter((m) =>
		isSupplementaryGrade(m.grade)
	);

	const remainInSemester = latestFailedModules.length >= 3;
	const status = remainInSemester ? 'Remain in Semester' : 'Proceed';

	const messageParts: string[] = [status];

	if (supplementary.length > 0) {
		messageParts.push(
			`must supplement ${supplementary.map((m) => m.semesterModule.module?.name).join(', ')}`
		);
	}
	if (failedModules.length > 0) {
		messageParts.push(
			`must repeat ${failedModules.map((m) => m.semesterModule.module?.name).join(', ')}`
		);
	}

	const message = messageParts.join(', ');

	let details = '';
	if (remainInSemester) {
		details = `Failed ${latestFailedModules.length} modules in latest semester`;
	} else {
		details = 'Student is eligible to proceed';
	}

	return {
		status,
		failedModules: getUniqueModules(failedModules),
		supplementaryModules: getUniqueModules(supplementary),
		message,
		details,
		totalModules: studentModules.length,
		totalCreditsAttempted,
		totalCreditsCompleted,
		points,
		latestPoints: points[points.length - 1] || {
			semesterId: 0,
			gpa: 0,
			cgpa: 0,
			creditsAttempted: 0,
			creditsCompleted: 0,
		},
	};
}

function getUniqueModules(modules: StudentModule[]) {
	return modules
		.filter((m) => m.semesterModule.module)
		.map((m) => ({
			id: m.semesterModule.module!.id,
			code: m.semesterModule.module!.code,
			name: m.semesterModule.module!.name,
		}))
		.filter(
			(module, index, array) =>
				array.findIndex((m) => m.name === module.name) === index
		);
}

function extractData(_programs: Program[]) {
	let programs = _programs
		.sort((a, b) => b.id - a.id)
		.filter((p) => p.status === 'Active');
	if (programs.length === 0) {
		programs = _programs
			.sort((a, b) => b.id - a.id)
			.filter((p) => p.status === 'Completed');
	}
	if (programs.length === 0) {
		return {
			semesters: [],
			studentModules: [],
		};
	}
	const semesters = programs[0].semesters || [];
	const filtered = [...semesters]
		.filter(
			(s) =>
				!['Deleted', 'Deferred', 'DroppedOut', 'Withdrawn'].includes(s.status)
		)
		.sort((a, b) => a.id - b.id);

	const studentModules = filtered
		.flatMap((s) => s.studentModules)
		.filter((m) => !['Delete', 'Drop'].includes(m.status));

	return {
		semesters: filtered,
		studentModules,
	};
}

export async function getOutstandingFromStructure(programs: Program[]) {
	const program = programs.find((it) =>
		['Active', 'Completed'].includes(it.status)
	);
	if (!program) {
		throw new Error('No active program found for student');
	}

	const structureModules = await getVisibleModulesForStructure(
		program.structureId
	);
	const requiredModules = structureModules.flatMap((semester) =>
		semester.semesterModules
			.filter((sm) => sm.module && !sm.hidden)
			.map((sm) => ({
				id: sm.module!.id,
				code: sm.module!.code,
				name: normalizeModuleName(sm.module!.name),
				originalName: sm.module!.name,
				type: sm.type,
				credits: sm.credits,
				semesterNumber: semester.semesterNumber,
			}))
	);

	const { studentModules } = extractData(programs);

	const attemptedModules = new Map<string, StudentModule[]>();

	studentModules.forEach((sm) => {
		if (sm.semesterModule.module) {
			const name = normalizeModuleName(sm.semesterModule.module.name);
			if (!attemptedModules.has(name)) {
				attemptedModules.set(name, []);
			}
			attemptedModules.get(name)!.push(sm);
		}
	});

	const failedNeverRepeated: typeof requiredModules = [];
	const neverAttempted: typeof requiredModules = [];

	for (const md of requiredModules) {
		const attempts = attemptedModules.get(md.name);

		if (!attempts || attempts.length === 0) {
			neverAttempted.push({
				...md,
				name: md.originalName,
			});
		} else {
			const passedAttempts = attempts.filter((attempt) =>
				isPassingGrade(attempt.grade || '')
			);

			if (passedAttempts.length === 0) {
				if (attempts.length === 1) {
					failedNeverRepeated.push({
						...md,
						name: md.originalName,
					});
				}
			}
		}
	}

	return {
		failedNeverRepeated,
		neverAttempted,
	};
}
