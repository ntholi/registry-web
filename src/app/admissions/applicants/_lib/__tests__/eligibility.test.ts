import type { ProgramLevel } from '@academic/_database';
import type { ResultClassification } from '@admissions/academic-records/_schema/academicRecords';
import type { StandardGrade } from '@admissions/academic-records/_schema/subjectGrades';
import type {
	ClassificationRules,
	EntryRequirementWithRelations,
	SubjectGradeRules,
} from '@admissions/entry-requirements/_lib/types';
import type { RecognizedSchool } from '@admissions/recognized-schools/_lib/types';
import { describe, expect, it } from 'vitest';
import { getEligiblePrograms } from '../eligibility';
import type { ApplicantWithRelations } from '../types';

type AcademicRecord = ApplicantWithRelations['academicRecords'][number];

const MATH_ID = 'subj-math';
const ENG_ID = 'subj-eng';
const LIT_ID = 'subj-lit';
const SCI_ID = 'subj-sci';
const BUS_ID = 'subj-bus';
const ACC_ID = 'subj-acc';

function createLgcseRecord(
	grades: { subjectId: string; grade: StandardGrade }[]
): AcademicRecord {
	return {
		id: 'rec-1',
		applicantId: 'app-1',
		certificateTypeId: 'lgcse',
		applicantDocumentId: null,
		qualificationName: 'LGCSE',
		institutionName: 'Test School',
		examYear: 2024,
		certificateNumber: null,
		candidateNumber: null,
		resultClassification: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		certificateType: { id: 'lgcse', name: 'LGCSE', lqfLevel: 3 },
		subjectGrades: grades.map((g, i) => ({
			id: `grade-${i}`,
			academicRecordId: 'rec-1',
			subjectId: g.subjectId,
			standardGrade: g.grade,
			originalGrade: g.grade,
			subject: { id: g.subjectId, name: `Subject ${g.subjectId}` },
		})),
	};
}

function createDiplomaRecord(
	classification: ResultClassification
): AcademicRecord {
	return {
		id: 'rec-diploma',
		applicantId: 'app-1',
		certificateTypeId: 'diploma',
		applicantDocumentId: null,
		qualificationName: 'Diploma in IT',
		institutionName: 'Test College',
		examYear: 2024,
		certificateNumber: null,
		candidateNumber: null,
		resultClassification: classification,
		createdAt: new Date(),
		updatedAt: new Date(),
		certificateType: { id: 'diploma', name: 'Diploma', lqfLevel: 5 },
		subjectGrades: [],
	};
}

function createProgram(
	id: number,
	code: string,
	name: string,
	level: ProgramLevel = 'diploma'
): EntryRequirementWithRelations['program'] {
	return {
		id,
		code,
		name,
		level,
		schoolId: 1,
		school: { id: 1, code: 'SIIT', name: 'School of IT', shortName: 'SIIT' },
	};
}

function createRecognizedSchool(name: string): RecognizedSchool {
	return {
		id: 1,
		name,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

function createLgcseRequirement(
	programId: number,
	code: string,
	name: string,
	rules: SubjectGradeRules
): EntryRequirementWithRelations {
	return {
		id: `req-${programId}`,
		programId,
		certificateTypeId: 'lgcse',
		rules,
		createdAt: new Date(),
		updatedAt: new Date(),
		program: createProgram(programId, code, name),
		certificateType: { id: 'lgcse', name: 'LGCSE', lqfLevel: 3 },
	};
}

function createDiplomaRequirement(
	programId: number,
	code: string,
	name: string,
	rules: ClassificationRules
): EntryRequirementWithRelations {
	return {
		id: `req-diploma-${programId}`,
		programId,
		certificateTypeId: 'diploma',
		rules,
		createdAt: new Date(),
		updatedAt: new Date(),
		program: createProgram(programId, code, name, 'degree'),
		certificateType: { id: 'diploma', name: 'Diploma', lqfLevel: 5 },
	};
}

describe('Eligibility - LGCSE Subject-Based Rules', () => {
	describe('Single minimumGrades requirement', () => {
		const requirements: EntryRequirementWithRelations[] = [
			createLgcseRequirement(1, 'DIT', 'Diploma in IT', {
				type: 'subject-grades',
				minimumGrades: [{ count: 5, grade: 'C' }],
				subjects: [],
			}),
		];

		it('should qualify student with exactly 5 C grades', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'C' },
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: BUS_ID, grade: 'C' },
					{ subjectId: ACC_ID, grade: 'C' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(1);
			expect(eligible[0].code).toBe('DIT');
		});

		it('should qualify student with 5 B grades (better than C)', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'B' },
					{ subjectId: ENG_ID, grade: 'B' },
					{ subjectId: SCI_ID, grade: 'B' },
					{ subjectId: BUS_ID, grade: 'B' },
					{ subjectId: ACC_ID, grade: 'B' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(1);
		});

		it('should NOT qualify student with only 4 C grades', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'C' },
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: BUS_ID, grade: 'C' },
					{ subjectId: ACC_ID, grade: 'D' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(0);
		});

		it('should NOT qualify student with 4 Cs and 1 F', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'C' },
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: BUS_ID, grade: 'C' },
					{ subjectId: ACC_ID, grade: 'F' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(0);
		});
	});

	describe('Multiple minimumGrades requirements (e.g., 3 Cs + 2 Ds)', () => {
		const requirements: EntryRequirementWithRelations[] = [
			createLgcseRequirement(1, 'DIT', 'Diploma in IT', {
				type: 'subject-grades',
				minimumGrades: [
					{ count: 3, grade: 'C' },
					{ count: 2, grade: 'D' },
				],
				subjects: [],
			}),
		];

		it('should qualify student with exactly 3 Cs and 2 Ds', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'C' },
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: BUS_ID, grade: 'D' },
					{ subjectId: ACC_ID, grade: 'D' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(1);
		});

		it('should qualify student with 5 B grades (exceeds all requirements)', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'B' },
					{ subjectId: ENG_ID, grade: 'B' },
					{ subjectId: SCI_ID, grade: 'B' },
					{ subjectId: BUS_ID, grade: 'B' },
					{ subjectId: ACC_ID, grade: 'B' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(1);
		});

		it('should qualify student with 4 Cs and 1 D (exceeds C requirement)', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'C' },
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: BUS_ID, grade: 'C' },
					{ subjectId: ACC_ID, grade: 'D' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(1);
		});

		it('should NOT qualify student with 4 Bs and 1 F', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'B' },
					{ subjectId: ENG_ID, grade: 'B' },
					{ subjectId: SCI_ID, grade: 'B' },
					{ subjectId: BUS_ID, grade: 'B' },
					{ subjectId: ACC_ID, grade: 'F' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(0);
		});

		it('should NOT qualify student with 2 Cs and 3 Ds (insufficient Cs)', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'C' },
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'D' },
					{ subjectId: BUS_ID, grade: 'D' },
					{ subjectId: ACC_ID, grade: 'D' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(0);
		});

		it('should NOT qualify student with 3 Cs and 1 D and 1 E', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'C' },
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: BUS_ID, grade: 'D' },
					{ subjectId: ACC_ID, grade: 'E' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(0);
		});
	});

	describe('Required subjects', () => {
		const requirements: EntryRequirementWithRelations[] = [
			createLgcseRequirement(1, 'DIT', 'Diploma in IT', {
				type: 'subject-grades',
				minimumGrades: [{ count: 5, grade: 'C' }],
				subjects: [{ subjectId: MATH_ID, minimumGrade: 'C', required: true }],
			}),
		];

		it('should qualify with 5 Cs including Math at C', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'C' },
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: BUS_ID, grade: 'C' },
					{ subjectId: ACC_ID, grade: 'C' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(1);
		});

		it('should qualify with Math at B (exceeds required C)', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'B' },
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: BUS_ID, grade: 'C' },
					{ subjectId: ACC_ID, grade: 'C' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(1);
		});

		it('should NOT qualify with Math at D (below required C)', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'D' },
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: BUS_ID, grade: 'C' },
					{ subjectId: ACC_ID, grade: 'C' },
					{ subjectId: LIT_ID, grade: 'C' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(0);
		});

		it('should NOT qualify without Math subject', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: ENG_ID, grade: 'A' },
					{ subjectId: SCI_ID, grade: 'A' },
					{ subjectId: BUS_ID, grade: 'A' },
					{ subjectId: ACC_ID, grade: 'A' },
					{ subjectId: LIT_ID, grade: 'A' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(0);
		});
	});

	describe('Optional subjects', () => {
		const requirements: EntryRequirementWithRelations[] = [
			createLgcseRequirement(1, 'DIT', 'Diploma in IT', {
				type: 'subject-grades',
				minimumGrades: [{ count: 5, grade: 'C' }],
				subjects: [{ subjectId: MATH_ID, minimumGrade: 'C', required: false }],
			}),
		];

		it('should qualify without optional subject present', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: BUS_ID, grade: 'C' },
					{ subjectId: ACC_ID, grade: 'C' },
					{ subjectId: LIT_ID, grade: 'C' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(1);
		});

		it('should qualify when optional subject is below minimum', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: BUS_ID, grade: 'C' },
					{ subjectId: ACC_ID, grade: 'C' },
					{ subjectId: LIT_ID, grade: 'C' },
					{ subjectId: MATH_ID, grade: 'F' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(1);
		});
	});

	describe('Subject groups (required)', () => {
		const requirements: EntryRequirementWithRelations[] = [
			createLgcseRequirement(1, 'DBM', 'Diploma in Business', {
				type: 'subject-grades',
				minimumGrades: [{ count: 5, grade: 'C' }],
				subjects: [],
				subjectGroups: [
					{
						name: 'Commercial Subjects',
						subjectIds: [BUS_ID, ACC_ID],
						minimumGrade: 'C',
						required: true,
					},
				],
			}),
		];

		it('should qualify with at least one subject from required group', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'C' },
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: BUS_ID, grade: 'C' },
					{ subjectId: LIT_ID, grade: 'C' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(1);
		});

		it('should qualify with Accounting from the group', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'C' },
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: ACC_ID, grade: 'B' },
					{ subjectId: LIT_ID, grade: 'C' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(1);
		});

		it('should NOT qualify without any subject from required group', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'A' },
					{ subjectId: ENG_ID, grade: 'A' },
					{ subjectId: SCI_ID, grade: 'A' },
					{ subjectId: LIT_ID, grade: 'A' },
					{ subjectId: 'subj-art', grade: 'A' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(0);
		});

		it('should NOT qualify with group subject below minimum grade', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'C' },
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: BUS_ID, grade: 'D' },
					{ subjectId: LIT_ID, grade: 'C' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(0);
		});
	});

	describe('Subject groups (optional/advantageous)', () => {
		const requirements: EntryRequirementWithRelations[] = [
			createLgcseRequirement(1, 'DGD', 'Diploma in Graphic Design', {
				type: 'subject-grades',
				minimumGrades: [{ count: 5, grade: 'C' }],
				subjects: [],
				subjectGroups: [
					{
						name: 'Design Subjects (Advantageous)',
						subjectIds: ['subj-art', 'subj-design'],
						minimumGrade: 'C',
						required: false,
					},
				],
			}),
		];

		it('should qualify without optional group subjects', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'C' },
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: BUS_ID, grade: 'C' },
					{ subjectId: LIT_ID, grade: 'C' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(1);
		});
	});

	describe('Combined requirements', () => {
		const requirements: EntryRequirementWithRelations[] = [
			createLgcseRequirement(1, 'DBIT', 'Diploma in Business IT', {
				type: 'subject-grades',
				minimumGrades: [
					{ count: 3, grade: 'C' },
					{ count: 2, grade: 'D' },
				],
				subjects: [{ subjectId: MATH_ID, minimumGrade: 'D', required: true }],
				subjectGroups: [
					{
						name: 'Commercial Subjects',
						subjectIds: [BUS_ID, ACC_ID],
						minimumGrade: 'C',
						required: true,
					},
				],
			}),
		];

		it('should qualify meeting all requirements', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'D' },
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: BUS_ID, grade: 'C' },
					{ subjectId: LIT_ID, grade: 'D' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(1);
		});

		it('should NOT qualify if Math is F (required subject fails)', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'F' },
					{ subjectId: ENG_ID, grade: 'A' },
					{ subjectId: SCI_ID, grade: 'A' },
					{ subjectId: BUS_ID, grade: 'A' },
					{ subjectId: LIT_ID, grade: 'A' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(0);
		});

		it('should NOT qualify if commercial subject missing', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'C' },
					{ subjectId: ENG_ID, grade: 'C' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: LIT_ID, grade: 'D' },
					{ subjectId: 'subj-art', grade: 'D' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(0);
		});
	});

	describe('Multiple programs eligibility', () => {
		const requirements: EntryRequirementWithRelations[] = [
			createLgcseRequirement(1, 'DIT', 'Diploma in IT', {
				type: 'subject-grades',
				minimumGrades: [{ count: 3, grade: 'C' }],
				subjects: [{ subjectId: MATH_ID, minimumGrade: 'C', required: true }],
			}),
			createLgcseRequirement(2, 'DBM', 'Diploma in Business', {
				type: 'subject-grades',
				minimumGrades: [{ count: 3, grade: 'C' }],
				subjects: [],
				subjectGroups: [
					{
						name: 'Commercial',
						subjectIds: [BUS_ID, ACC_ID],
						minimumGrade: 'C',
						required: true,
					},
				],
			}),
			createLgcseRequirement(3, 'DJM', 'Diploma in Journalism', {
				type: 'subject-grades',
				minimumGrades: [{ count: 4, grade: 'C' }],
				subjects: [{ subjectId: ENG_ID, minimumGrade: 'C', required: true }],
			}),
		];

		it('should return multiple programs for well-rounded student', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'B' },
					{ subjectId: ENG_ID, grade: 'B' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: BUS_ID, grade: 'C' },
					{ subjectId: LIT_ID, grade: 'C' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(3);
			expect(eligible.map((p) => p.code).sort()).toEqual(['DBM', 'DIT', 'DJM']);
		});

		it('should return only IT program for Math-focused student', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'A' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: 'subj-phy', grade: 'C' },
					{ subjectId: ENG_ID, grade: 'D' },
					{ subjectId: LIT_ID, grade: 'D' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(1);
			expect(eligible[0].code).toBe('DIT');
		});

		it('should return Business only for commerce student', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: BUS_ID, grade: 'B' },
					{ subjectId: ACC_ID, grade: 'B' },
					{ subjectId: 'subj-econ', grade: 'C' },
					{ subjectId: MATH_ID, grade: 'D' },
					{ subjectId: ENG_ID, grade: 'D' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(1);
			expect(eligible[0].code).toBe('DBM');
		});
	});

	describe('Grade hierarchy and edge cases', () => {
		const requirements: EntryRequirementWithRelations[] = [
			createLgcseRequirement(1, 'TEST', 'Test Program', {
				type: 'subject-grades',
				minimumGrades: [{ count: 3, grade: 'C' }],
				subjects: [],
			}),
		];

		it('should treat A* as highest grade', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'A*' },
					{ subjectId: ENG_ID, grade: 'A*' },
					{ subjectId: SCI_ID, grade: 'A*' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(1);
		});

		it('should handle mixed grades correctly', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'A*' },
					{ subjectId: ENG_ID, grade: 'B' },
					{ subjectId: SCI_ID, grade: 'C' },
					{ subjectId: BUS_ID, grade: 'D' },
					{ subjectId: ACC_ID, grade: 'E' },
					{ subjectId: LIT_ID, grade: 'F' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(1);
		});

		it('should return empty for all failing grades', () => {
			const records = [
				createLgcseRecord([
					{ subjectId: MATH_ID, grade: 'U' },
					{ subjectId: ENG_ID, grade: 'U' },
					{ subjectId: SCI_ID, grade: 'U' },
				]),
			];

			const eligible = getEligiblePrograms(records, requirements);
			expect(eligible).toHaveLength(0);
		});

		it('should return empty for no records', () => {
			const eligible = getEligiblePrograms([], requirements);
			expect(eligible).toHaveLength(0);
		});
	});
});

describe('Eligibility - Classification-Based Rules (Diploma entry)', () => {
	const requirements: EntryRequirementWithRelations[] = [
		createDiplomaRequirement(1, 'BSCIT', 'BSc in IT', {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: ['Diploma in IT'],
		}),
		createDiplomaRequirement(2, 'BSCBIT', 'BSc in Business IT', {
			type: 'classification',
			minimumClassification: 'Credit',
			courses: ['Diploma in IT'],
		}),
		createDiplomaRequirement(3, 'BSCS', 'BSc in Computer Science', {
			type: 'classification',
			courses: ['Diploma in IT'],
		}),
	];
	const recognized = [createRecognizedSchool('Test College')];

	it('should qualify with Pass classification for Pass requirement', () => {
		const records = [createDiplomaRecord('Pass')];

		const eligible = getEligiblePrograms(records, requirements, recognized);
		expect(eligible.some((p) => p.code === 'BSCIT')).toBe(true);
	});

	it('should qualify with Distinction for Pass requirement', () => {
		const records = [createDiplomaRecord('Distinction')];

		const eligible = getEligiblePrograms(records, requirements, recognized);
		expect(eligible.some((p) => p.code === 'BSCIT')).toBe(true);
	});

	it('should NOT qualify with Pass for Credit requirement', () => {
		const records = [createDiplomaRecord('Pass')];

		const eligible = getEligiblePrograms(records, requirements, recognized);
		expect(eligible.some((p) => p.code === 'BSCBIT')).toBe(false);
	});

	it('should qualify with Credit for Credit requirement', () => {
		const records = [createDiplomaRecord('Credit')];

		const eligible = getEligiblePrograms(records, requirements, recognized);
		expect(eligible.some((p) => p.code === 'BSCBIT')).toBe(true);
	});

	it('should default to Pass when minimum classification is missing', () => {
		const records = [createDiplomaRecord('Pass')];

		const eligible = getEligiblePrograms(records, requirements, recognized);
		expect(eligible.some((p) => p.code === 'BSCS')).toBe(true);
	});

	it('should not qualify when courses list is empty', () => {
		const records = [createDiplomaRecord('Pass')];
		const emptyCourseReq = createDiplomaRequirement(
			4,
			'BSENG',
			'BSc in Engineering',
			{
				type: 'classification',
				minimumClassification: 'Pass',
				courses: [],
			}
		);

		const eligible = getEligiblePrograms(records, [emptyCourseReq], recognized);
		expect(eligible).toHaveLength(0);
	});

	it('should match course names case-insensitively and trimmed', () => {
		const records = [createDiplomaRecord('Pass')];
		const courseReq = createDiplomaRequirement(
			5,
			'BSSE',
			'BSc in Software Engineering',
			{
				type: 'classification',
				minimumClassification: 'Pass',
				courses: ['  diploma in it  '],
			}
		);

		const eligible = getEligiblePrograms(records, [courseReq], recognized);
		expect(eligible).toHaveLength(1);
		expect(eligible[0].code).toBe('BSSE');
	});

	it('should qualify when any course in the list matches', () => {
		const records = [createDiplomaRecord('Pass')];
		const courseReq = createDiplomaRequirement(
			6,
			'BSIS',
			'BSc in Information Systems',
			{
				type: 'classification',
				minimumClassification: 'Pass',
				courses: ['Diploma in Business', 'Diploma in IT'],
			}
		);

		const eligible = getEligiblePrograms(records, [courseReq], recognized);
		expect(eligible).toHaveLength(1);
		expect(eligible[0].code).toBe('BSIS');
	});
});

describe('Eligibility - LQF Level Matching', () => {
	const lgcseReq = createLgcseRequirement(1, 'DIT', 'Diploma in IT', {
		type: 'subject-grades',
		minimumGrades: [{ count: 3, grade: 'C' }],
		subjects: [],
	});

	const diplomaReq = createDiplomaRequirement(2, 'BSCIT', 'BSc in IT', {
		type: 'classification',
		minimumClassification: 'Pass',
		courses: ['Diploma in IT'],
	});

	it('should only match LGCSE requirements for LGCSE records', () => {
		const records = [
			createLgcseRecord([
				{ subjectId: MATH_ID, grade: 'C' },
				{ subjectId: ENG_ID, grade: 'C' },
				{ subjectId: SCI_ID, grade: 'C' },
			]),
		];

		const eligible = getEligiblePrograms(records, [lgcseReq, diplomaReq]);
		expect(eligible).toHaveLength(1);
		expect(eligible[0].code).toBe('DIT');
	});

	it('should only match Diploma requirements for Diploma records', () => {
		const records = [createDiplomaRecord('Pass')];
		const recognized = [createRecognizedSchool('Test College')];

		const eligible = getEligiblePrograms(
			records,
			[lgcseReq, diplomaReq],
			recognized
		);
		expect(eligible).toHaveLength(1);
		expect(eligible[0].code).toBe('BSCIT');
	});

	it('should use highest LQF level when student has both', () => {
		const lgcse = createLgcseRecord([
			{ subjectId: MATH_ID, grade: 'A' },
			{ subjectId: ENG_ID, grade: 'A' },
			{ subjectId: SCI_ID, grade: 'A' },
		]);
		const diploma = createDiplomaRecord('Credit');
		const records = [lgcse, diploma];
		const recognized = [createRecognizedSchool('Test College')];

		const eligible = getEligiblePrograms(
			records,
			[lgcseReq, diplomaReq],
			recognized
		);
		expect(eligible).toHaveLength(1);
		expect(eligible[0].code).toBe('BSCIT');
	});
});

describe('Eligibility - Recognized Schools (LQF 5+)', () => {
	const diplomaReq = createDiplomaRequirement(1, 'BSCIT', 'BSc in IT', {
		type: 'classification',
		minimumClassification: 'Pass',
		courses: ['Diploma in IT'],
	});

	it('should allow eligibility for recognized institutions at LQF 5+', () => {
		const records = [createDiplomaRecord('Pass')];
		const recognized = [createRecognizedSchool('Test College')];

		const eligible = getEligiblePrograms(records, [diplomaReq], recognized);
		expect(eligible).toHaveLength(1);
	});

	it('should block eligibility for unrecognized institutions at LQF 5+', () => {
		const records = [createDiplomaRecord('Pass')];
		const recognized = [createRecognizedSchool('Other College')];

		const eligible = getEligiblePrograms(records, [diplomaReq], recognized);
		expect(eligible).toHaveLength(0);
	});

	it('should block eligibility when recognition list is empty for LQF 5+', () => {
		const records = [createDiplomaRecord('Pass')];

		const eligible = getEligiblePrograms(records, [diplomaReq], []);
		expect(eligible).toHaveLength(0);
	});

	it('should allow eligibility when any highest-level record is recognized', () => {
		const rec1 = createDiplomaRecord('Pass');
		const rec2 = createDiplomaRecord('Credit');
		rec2.id = 'rec-diploma-2';
		rec2.institutionName = 'Other College';
		const records = [rec1, rec2];
		const recognized = [createRecognizedSchool('Test College')];

		const eligible = getEligiblePrograms(records, [diplomaReq], recognized);
		expect(eligible).toHaveLength(1);
	});

	it('should use recognized records for course matching at LQF 5+', () => {
		const rec1 = createDiplomaRecord('Pass');
		rec1.qualificationName = 'Diploma in Business';
		rec1.institutionName = 'Test College';
		const rec2 = createDiplomaRecord('Pass');
		rec2.id = 'rec-diploma-2';
		rec2.qualificationName = 'Diploma in IT';
		rec2.institutionName = 'Other College';
		const records = [rec1, rec2];
		const recognized = [createRecognizedSchool('Test College')];

		const eligible = getEligiblePrograms(records, [diplomaReq], recognized);
		expect(eligible).toHaveLength(0);
	});

	it('should not require recognition for LQF below 5', () => {
		const requirements: EntryRequirementWithRelations[] = [
			createLgcseRequirement(1, 'DIT', 'Diploma in IT', {
				type: 'subject-grades',
				minimumGrades: [{ count: 3, grade: 'C' }],
				subjects: [],
			}),
		];
		const records = [
			createLgcseRecord([
				{ subjectId: MATH_ID, grade: 'C' },
				{ subjectId: ENG_ID, grade: 'C' },
				{ subjectId: SCI_ID, grade: 'C' },
			]),
		];

		const eligible = getEligiblePrograms(records, requirements, []);
		expect(eligible).toHaveLength(1);
	});
});

describe('Eligibility - Best Grade Selection', () => {
	const requirements: EntryRequirementWithRelations[] = [
		createLgcseRequirement(1, 'DIT', 'Diploma in IT', {
			type: 'subject-grades',
			minimumGrades: [{ count: 3, grade: 'B' }],
			subjects: [],
		}),
	];

	it('should use best grade when subject appears in multiple records', () => {
		const record1 = createLgcseRecord([
			{ subjectId: MATH_ID, grade: 'D' },
			{ subjectId: ENG_ID, grade: 'C' },
			{ subjectId: SCI_ID, grade: 'D' },
		]);
		const record2 = createLgcseRecord([
			{ subjectId: MATH_ID, grade: 'B' },
			{ subjectId: ENG_ID, grade: 'B' },
			{ subjectId: SCI_ID, grade: 'B' },
		]);
		record2.id = 'rec-2';

		const eligible = getEligiblePrograms([record1, record2], requirements);
		expect(eligible).toHaveLength(1);
	});
});
