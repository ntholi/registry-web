import { programs } from '@academic/_database';
import {
	certificateTypes,
	entryRequirements,
	subjects,
} from '@/app/admissions/_database';
import type {
	ClassificationRules,
	SubjectGradeRules,
} from '@/app/admissions/entry-requirements/_lib/types';
import { db } from '../index';

type SubjectMap = Map<string, string>;
type ProgramMap = Map<string, number>;
type CertTypeMap = Map<string, string>;

export async function seedEntryRequirements() {
	console.log('🌱 Seeding entry requirements...');

	const [subjectRows, programRows, certTypeRows] = await Promise.all([
		db.select({ id: subjects.id, name: subjects.name }).from(subjects),
		db.select({ id: programs.id, code: programs.code }).from(programs),
		db
			.select({ id: certificateTypes.id, name: certificateTypes.name })
			.from(certificateTypes),
	]);

	const subjectMap: SubjectMap = new Map(
		subjectRows.map((s) => [s.name, s.id])
	);
	const programMap: ProgramMap = new Map(
		programRows.map((p) => [p.code, p.id])
	);
	const certTypeMap: CertTypeMap = new Map(
		certTypeRows.map((c) => [c.name, c.id])
	);

	const S = (name: string) => {
		const id = subjectMap.get(name);
		if (!id) throw new Error(`Subject not found: ${name}`);
		return id;
	};

	const P = (code: string) => {
		const id = programMap.get(code);
		if (!id) throw new Error(`Program not found: ${code}`);
		return id;
	};

	const C = (name: string) => {
		const id = certTypeMap.get(name);
		if (!id) throw new Error(`Certificate type not found: ${name}`);
		return id;
	};

	const requirements: {
		programId: number;
		certificateTypeId: string;
		rules: SubjectGradeRules | ClassificationRules;
	}[] = [];

	const LGCSE = C('LGCSE');
	const CERT = C('Certificate');
	const DIPLOMA = C('Diploma');

	const MATH = S('Mathematics');
	const ENG = S('English Language');
	const LIT = S('Literature in English');
	const ACC = S('Accounting');
	const BUS = S('Business Studies');
	const ECON = S('Economics');
	const PHYS_SCI = S('Physical Science');
	const ART = S('Art');
	const WOODWORK = S('Woodwork');
	const HOME_ECON = S('Home Economics');
	const ART_DESIGN = S('Art and Design');
	const DESIGN_TECH = S('Design and Technology');
	const NEEDLEWORK = S('Needlework');
	const TECH_DRAWING = S('Technical Drawing');
	const BRICKLAYING = S('Bricklaying');
	const COMMERCE = S('Commerce');

	const commercialSubjects = [ACC, BUS, ECON, COMMERCE];
	const designSubjects = [
		ART,
		WOODWORK,
		HOME_ECON,
		ART_DESIGN,
		DESIGN_TECH,
		NEEDLEWORK,
	];

	// ============================================================
	// DIPLOMA PROGRAMS (LGCSE entry) - Based on ENROLMENT PLAN.docx.md
	// ============================================================

	// 1. Diploma in Information Technology (DIT)
	// "3C grades including Mathematics and a D in any 2 subjects OR 4C grades or better including Mathematics OR relevant certificate"
	requirements.push({
		programId: P('DIT'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 3, grade: 'C' },
			requiredSubjects: [{ subjectId: MATH, minimumGrade: 'C' }],
			alternatives: [
				{
					type: 'subject-grades',
					minimumGrades: { count: 4, grade: 'C' },
					requiredSubjects: [{ subjectId: MATH, minimumGrade: 'C' }],
				},
			],
		},
	});
	requirements.push({
		programId: P('DIT'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Certificate in IT',
		},
	});

	// 2. Diploma in Multimedia & Software Engineering (DMSE)
	// "3C grades including Mathematics and a D in any 2 subjects OR 4C grades or better including Mathematics OR relevant certificate"
	requirements.push({
		programId: P('DMSE'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 3, grade: 'C' },
			requiredSubjects: [{ subjectId: MATH, minimumGrade: 'C' }],
			alternatives: [
				{
					type: 'subject-grades',
					minimumGrades: { count: 4, grade: 'C' },
					requiredSubjects: [{ subjectId: MATH, minimumGrade: 'C' }],
				},
			],
		},
	});
	requirements.push({
		programId: P('DMSE'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Certificate',
		},
	});

	// 3. Diploma in Business Information Technology (DBIT)
	// "3C grades including Mathematics and a D in any 2 subjects. D grade in Mathematics with at least 3C grades or better including Commercial/Financial subject and a D in any 2 subjects OR 4C grades or better OR relevant certificate"
	requirements.push({
		programId: P('DBIT'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 3, grade: 'C' },
			requiredSubjects: [{ subjectId: MATH, minimumGrade: 'C' }],
			optionalSubjectGroups: [
				{
					name: 'Commercial/Financial Subjects',
					subjectIds: commercialSubjects,
					minimumGrade: 'C',
					required: false,
				},
			],
			alternatives: [
				{
					type: 'subject-grades',
					minimumGrades: { count: 3, grade: 'C' },
					requiredSubjects: [{ subjectId: MATH, minimumGrade: 'D' }],
					optionalSubjectGroups: [
						{
							name: 'Commercial/Financial Subjects',
							subjectIds: commercialSubjects,
							minimumGrade: 'C',
							required: true,
						},
					],
				},
				{
					type: 'subject-grades',
					minimumGrades: { count: 4, grade: 'C' },
					requiredSubjects: [],
				},
			],
		},
	});
	requirements.push({
		programId: P('DBIT'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Certificate',
		},
	});

	// 7. Diploma in Public Relations (DPR)
	// "3C grades including a C in English and/or LIT with at least a D in any other two subjects OR 4C grades or better including ENG and/LIT OR relevant certificate"
	requirements.push({
		programId: P('DPR'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 3, grade: 'C' },
			requiredSubjects: [],
			optionalSubjectGroups: [
				{
					name: 'English/Literature',
					subjectIds: [ENG, LIT],
					minimumGrade: 'C',
					required: true,
				},
			],
			alternatives: [
				{
					type: 'subject-grades',
					minimumGrades: { count: 4, grade: 'C' },
					requiredSubjects: [],
					optionalSubjectGroups: [
						{
							name: 'English/Literature',
							subjectIds: [ENG, LIT],
							minimumGrade: 'C',
							required: true,
						},
					],
				},
			],
		},
	});
	requirements.push({
		programId: P('DPR'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Certificate',
		},
	});

	// 8. Diploma in Broadcasting (Radio & TV) (DBRTV)
	// "3C grades including a C in English and/or LIT with at least a D in any other two subjects or 4C grades or better including ENG and/LIT OR relevant certificate"
	requirements.push({
		programId: P('DBRTV'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 3, grade: 'C' },
			requiredSubjects: [],
			optionalSubjectGroups: [
				{
					name: 'English/Literature',
					subjectIds: [ENG, LIT],
					minimumGrade: 'C',
					required: true,
				},
			],
			alternatives: [
				{
					type: 'subject-grades',
					minimumGrades: { count: 4, grade: 'C' },
					requiredSubjects: [],
					optionalSubjectGroups: [
						{
							name: 'English/Literature',
							subjectIds: [ENG, LIT],
							minimumGrade: 'C',
							required: true,
						},
					],
				},
			],
		},
	});
	requirements.push({
		programId: P('DBRTV'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Certificate',
		},
	});

	// 9. Diploma in Film Production (DFP)
	// "3C grades including a C in English and/or LIT with at least a D in any other two subjects OR 4C grades or better including ENG and/LIT OR relevant certificate"
	requirements.push({
		programId: P('DFP'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 3, grade: 'C' },
			requiredSubjects: [],
			optionalSubjectGroups: [
				{
					name: 'English/Literature',
					subjectIds: [ENG, LIT],
					minimumGrade: 'C',
					required: true,
				},
			],
			alternatives: [
				{
					type: 'subject-grades',
					minimumGrades: { count: 4, grade: 'C' },
					requiredSubjects: [],
					optionalSubjectGroups: [
						{
							name: 'English/Literature',
							subjectIds: [ENG, LIT],
							minimumGrade: 'C',
							required: true,
						},
					],
				},
			],
		},
	});
	requirements.push({
		programId: P('DFP'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Certificate',
		},
	});

	// 10. Diploma in Journalism & Media (DJM)
	// "3C grades including a C in English and/or LIT with at least a D in any other two subjects OR 4C grades or better including ENG and/LIT OR relevant certificate"
	requirements.push({
		programId: P('DJM'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 3, grade: 'C' },
			requiredSubjects: [],
			optionalSubjectGroups: [
				{
					name: 'English/Literature',
					subjectIds: [ENG, LIT],
					minimumGrade: 'C',
					required: true,
				},
			],
			alternatives: [
				{
					type: 'subject-grades',
					minimumGrades: { count: 4, grade: 'C' },
					requiredSubjects: [],
					optionalSubjectGroups: [
						{
							name: 'English/Literature',
							subjectIds: [ENG, LIT],
							minimumGrade: 'C',
							required: true,
						},
					],
				},
			],
		},
	});
	requirements.push({
		programId: P('DJM'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Certificate',
		},
	});

	// 14. Diploma in Graphic Design (DGD)
	// "3C grades with at least a D in any other two subjects. At least a D in English Language and submission of portfolio, a credit in any of: Art, Woodwork, Home Economics, Art and Design and Design and Technology and Needlework. A diploma in any relevant field or TVET certificate in any relevant field from a recognized institution or N4 in any relevant field."
	requirements.push({
		programId: P('DGD'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 3, grade: 'C' },
			requiredSubjects: [{ subjectId: ENG, minimumGrade: 'D' }],
			optionalSubjectGroups: [
				{
					name: 'Design Subjects (Advantageous)',
					subjectIds: designSubjects,
					minimumGrade: 'C',
					required: false,
				},
			],
		},
	});
	requirements.push({
		programId: P('DGD'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'TVET Certificate or N4 in relevant field',
		},
	});

	// 15. Diploma in Creative Advertising (DCA)
	// Same as Graphic Design
	requirements.push({
		programId: P('DCA'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 3, grade: 'C' },
			requiredSubjects: [{ subjectId: ENG, minimumGrade: 'D' }],
			optionalSubjectGroups: [
				{
					name: 'Design Subjects (Advantageous)',
					subjectIds: designSubjects,
					minimumGrade: 'C',
					required: false,
				},
			],
		},
	});
	requirements.push({
		programId: P('DCA'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'TVET Certificate or N4 in relevant field',
		},
	});

	// 16. Diploma in Fashion & Apparel Design (DFAD)
	// Same as Graphic Design
	requirements.push({
		programId: P('DFAD'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 3, grade: 'C' },
			requiredSubjects: [{ subjectId: ENG, minimumGrade: 'D' }],
			optionalSubjectGroups: [
				{
					name: 'Design Subjects (Advantageous)',
					subjectIds: designSubjects,
					minimumGrade: 'C',
					required: false,
				},
			],
		},
	});
	requirements.push({
		programId: P('DFAD'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'TVET Certificate or N4 in relevant field',
		},
	});

	// 17. Diploma in Architecture Technology (DAT)
	// "3C grades with at least a D in any other two subjects. A D in Mathematics with a credit in physical science any of the below subjects is an added advantage: Art, Woodwork, Art and Design and Design and Technology, Technical Drawing in Bricklaying OR relevant certificate"
	requirements.push({
		programId: P('DAT'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 3, grade: 'C' },
			requiredSubjects: [{ subjectId: MATH, minimumGrade: 'D' }],
			optionalSubjectGroups: [
				{
					name: 'Physical Science (Advantageous)',
					subjectIds: [PHYS_SCI],
					minimumGrade: 'C',
					required: false,
				},
				{
					name: 'Design/Technical Subjects (Advantageous)',
					subjectIds: [
						ART,
						WOODWORK,
						ART_DESIGN,
						DESIGN_TECH,
						TECH_DRAWING,
						BRICKLAYING,
					],
					minimumGrade: 'C',
					required: false,
				},
			],
		},
	});
	requirements.push({
		programId: P('DAT'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Certificate',
		},
	});

	// 19. Diploma in Tourism (DTM) - mapped to DITR (Diploma in International Tourism)
	// "D English Language OR English Language with a C or better in Literature, 3C grades or better and D in any other subject OR 4C grade or better OR relevant certificate"
	requirements.push({
		programId: P('DITR'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 3, grade: 'C' },
			requiredSubjects: [{ subjectId: ENG, minimumGrade: 'D' }],
			optionalSubjectGroups: [
				{
					name: 'Literature (Advantageous)',
					subjectIds: [LIT],
					minimumGrade: 'C',
					required: false,
				},
			],
			alternatives: [
				{
					type: 'subject-grades',
					minimumGrades: { count: 4, grade: 'C' },
					requiredSubjects: [],
				},
			],
		},
	});
	requirements.push({
		programId: P('DITR'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Certificate',
		},
	});

	// 20. Diploma in Hotel Management (DHM)
	// Same as Tourism
	requirements.push({
		programId: P('DHM'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 3, grade: 'C' },
			requiredSubjects: [{ subjectId: ENG, minimumGrade: 'D' }],
			optionalSubjectGroups: [
				{
					name: 'Literature (Advantageous)',
					subjectIds: [LIT],
					minimumGrade: 'C',
					required: false,
				},
			],
			alternatives: [
				{
					type: 'subject-grades',
					minimumGrades: { count: 4, grade: 'C' },
					requiredSubjects: [],
				},
			],
		},
	});
	requirements.push({
		programId: P('DHM'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Certificate',
		},
	});

	// 21. Diploma in Events Management (DEM)
	// Same as Tourism
	requirements.push({
		programId: P('DEM'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 3, grade: 'C' },
			requiredSubjects: [{ subjectId: ENG, minimumGrade: 'D' }],
			optionalSubjectGroups: [
				{
					name: 'Literature (Advantageous)',
					subjectIds: [LIT],
					minimumGrade: 'C',
					required: false,
				},
			],
			alternatives: [
				{
					type: 'subject-grades',
					minimumGrades: { count: 4, grade: 'C' },
					requiredSubjects: [],
				},
			],
		},
	});
	requirements.push({
		programId: P('DEM'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Certificate',
		},
	});

	// 23. Diploma in Business Management (DBM)
	// "3C grades or better including pass grade or better in Mathematics and Commercial/Financial subjects with at least a D in any other two subjects OR Certificate or Diploma in a relevant field"
	requirements.push({
		programId: P('DBM'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 3, grade: 'C' },
			requiredSubjects: [{ subjectId: MATH, minimumGrade: 'D' }],
			optionalSubjectGroups: [
				{
					name: 'Commercial/Financial Subjects',
					subjectIds: commercialSubjects,
					minimumGrade: 'D',
					required: true,
				},
			],
		},
	});
	requirements.push({
		programId: P('DBM'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Certificate in a relevant field',
		},
	});

	// 24. Diploma in Marketing (DMK)
	// Same as Business Management
	requirements.push({
		programId: P('DMK'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 3, grade: 'C' },
			requiredSubjects: [{ subjectId: MATH, minimumGrade: 'D' }],
			optionalSubjectGroups: [
				{
					name: 'Commercial/Financial Subjects',
					subjectIds: commercialSubjects,
					minimumGrade: 'D',
					required: true,
				},
			],
		},
	});
	requirements.push({
		programId: P('DMK'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Certificate in a relevant field',
		},
	});

	// 25. Diploma in Retail Management (DRM)
	// Same as Business Management
	requirements.push({
		programId: P('DRM'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 3, grade: 'C' },
			requiredSubjects: [{ subjectId: MATH, minimumGrade: 'D' }],
			optionalSubjectGroups: [
				{
					name: 'Commercial/Financial Subjects',
					subjectIds: commercialSubjects,
					minimumGrade: 'D',
					required: true,
				},
			],
		},
	});
	requirements.push({
		programId: P('DRM'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Certificate in a relevant field',
		},
	});

	// ============================================================
	// BACHELOR PROGRAMS (LGCSE/Diploma entry)
	// ============================================================

	// 4. BSc in Information Technology (BSCIT)
	// "4C grades or better including Mathematics and a D in any 2 subjects OR relevant diploma"
	requirements.push({
		programId: P('BSCIT'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 4, grade: 'C' },
			requiredSubjects: [{ subjectId: MATH, minimumGrade: 'C' }],
		},
	});
	requirements.push({
		programId: P('BSCIT'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Diploma in IT',
		},
	});

	// 5. BSc in Software Engineering with Multimedia (BSCSM)
	// "4C grades or better including Mathematics and a D in any 2 subjects OR relevant diploma"
	requirements.push({
		programId: P('BSCSM'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 4, grade: 'C' },
			requiredSubjects: [{ subjectId: MATH, minimumGrade: 'C' }],
		},
	});
	requirements.push({
		programId: P('BSCSM'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Diploma',
		},
	});

	// 6. BSc in Business Information Technology (BSCBIT)
	// "4C grades or better including Mathematics with at least a D in any 2 subjects OR D grade in Mathematics with 4C grades or better including Commercial/Financial subjects OR relevant diploma"
	requirements.push({
		programId: P('BSCBIT'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 4, grade: 'C' },
			requiredSubjects: [{ subjectId: MATH, minimumGrade: 'C' }],
			alternatives: [
				{
					type: 'subject-grades',
					minimumGrades: { count: 4, grade: 'C' },
					requiredSubjects: [{ subjectId: MATH, minimumGrade: 'D' }],
					optionalSubjectGroups: [
						{
							name: 'Commercial/Financial Subjects',
							subjectIds: commercialSubjects,
							minimumGrade: 'C',
							required: true,
						},
					],
				},
			],
		},
	});
	requirements.push({
		programId: P('BSCBIT'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Diploma',
		},
	});

	// 11. BA in Professional Communication (BPC)
	// "4C grades or better including English Language and/or LIT with at least two Ds in any other two subjects or relevant diploma"
	requirements.push({
		programId: P('BPC'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 4, grade: 'C' },
			requiredSubjects: [],
			optionalSubjectGroups: [
				{
					name: 'English/Literature',
					subjectIds: [ENG, LIT],
					minimumGrade: 'C',
					required: true,
				},
			],
		},
	});
	requirements.push({
		programId: P('BPC'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Diploma',
		},
	});

	// 12. BA in Broadcasting & Journalism (BBJ)
	// "4C grades or better including English Language and/or LIT with at least two Ds in any other two subjects or relevant diploma"
	requirements.push({
		programId: P('BBJ'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 4, grade: 'C' },
			requiredSubjects: [],
			optionalSubjectGroups: [
				{
					name: 'English/Literature',
					subjectIds: [ENG, LIT],
					minimumGrade: 'C',
					required: true,
				},
			],
		},
	});
	requirements.push({
		programId: P('BBJ'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Diploma',
		},
	});

	// 13. BA in Digital Film & TV (BDF)
	// "4C grades including a C in English and/or LIT with at least a D in any other two subjects OR relevant certificate"
	requirements.push({
		programId: P('BDF'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 4, grade: 'C' },
			requiredSubjects: [],
			optionalSubjectGroups: [
				{
					name: 'English/Literature',
					subjectIds: [ENG, LIT],
					minimumGrade: 'C',
					required: true,
				},
			],
		},
	});
	requirements.push({
		programId: P('BDF'),
		certificateTypeId: CERT,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Certificate',
		},
	});

	// 18. BA in Architectural Studies (BAS)
	// "4C grades with at least a D in any other two subjects. A D Mathematics or E Mathematics with a credit in physical science in any of: Art, Woodwork, Art and Design and Design and Technology, Technical Drawing in Bricklaying OR relevant drawing."
	requirements.push({
		programId: P('BAS'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 4, grade: 'C' },
			requiredSubjects: [{ subjectId: MATH, minimumGrade: 'E' }],
			optionalSubjectGroups: [
				{
					name: 'Physical Science (Advantageous)',
					subjectIds: [PHYS_SCI],
					minimumGrade: 'C',
					required: false,
				},
				{
					name: 'Design/Technical Subjects (Advantageous)',
					subjectIds: [
						ART,
						WOODWORK,
						ART_DESIGN,
						DESIGN_TECH,
						TECH_DRAWING,
						BRICKLAYING,
					],
					minimumGrade: 'C',
					required: false,
				},
			],
		},
	});
	requirements.push({
		programId: P('BAS'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Diploma',
		},
	});

	// 22. BA in Tourism Management (BTM)
	// "D English Language OR English Language with a C or better in Literature, 4C grades or better and D in any other subject OR 5C grades or better OR relevant diploma"
	requirements.push({
		programId: P('BTM'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 4, grade: 'C' },
			requiredSubjects: [{ subjectId: ENG, minimumGrade: 'D' }],
			optionalSubjectGroups: [
				{
					name: 'Literature (Advantageous)',
					subjectIds: [LIT],
					minimumGrade: 'C',
					required: false,
				},
			],
			alternatives: [
				{
					type: 'subject-grades',
					minimumGrades: { count: 5, grade: 'C' },
					requiredSubjects: [],
				},
			],
		},
	});
	requirements.push({
		programId: P('BTM'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Relevant Diploma',
		},
	});

	// 26. B BUSS in International Business (BIB)
	// "4C grades or better Mathematics or Commercial subject, with at least a D in Mathematics/Mathematics with C in Commercial OR Diploma in a relevant field"
	requirements.push({
		programId: P('BIB'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 4, grade: 'C' },
			requiredSubjects: [{ subjectId: MATH, minimumGrade: 'D' }],
			optionalSubjectGroups: [
				{
					name: 'Commercial Subjects',
					subjectIds: commercialSubjects,
					minimumGrade: 'C',
					required: false,
				},
			],
			alternatives: [
				{
					type: 'subject-grades',
					minimumGrades: { count: 4, grade: 'C' },
					requiredSubjects: [],
					optionalSubjectGroups: [
						{
							name: 'Commercial Subjects',
							subjectIds: commercialSubjects,
							minimumGrade: 'C',
							required: true,
						},
					],
				},
			],
		},
	});
	requirements.push({
		programId: P('BIB'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Diploma in a relevant field',
		},
	});

	// 27. B BUSS in Entrepreneurship (BEN)
	// Same as International Business
	requirements.push({
		programId: P('BEN'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 4, grade: 'C' },
			requiredSubjects: [{ subjectId: MATH, minimumGrade: 'D' }],
			optionalSubjectGroups: [
				{
					name: 'Commercial Subjects',
					subjectIds: commercialSubjects,
					minimumGrade: 'C',
					required: false,
				},
			],
			alternatives: [
				{
					type: 'subject-grades',
					minimumGrades: { count: 4, grade: 'C' },
					requiredSubjects: [],
					optionalSubjectGroups: [
						{
							name: 'Commercial Subjects',
							subjectIds: commercialSubjects,
							minimumGrade: 'C',
							required: true,
						},
					],
				},
			],
		},
	});
	requirements.push({
		programId: P('BEN'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Diploma in a relevant field',
		},
	});

	// 28. BA in Human Resource Management (BHR)
	// "Pass in Mathematics, D/, 4c grades & two D grades or better or Diploma in a relevant field."
	requirements.push({
		programId: P('BHR'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 4, grade: 'C' },
			requiredSubjects: [{ subjectId: MATH, minimumGrade: 'D' }],
		},
	});
	requirements.push({
		programId: P('BHR'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName: 'Diploma in a relevant field',
		},
	});

	// 30. BA in Fashion & Apparel Design (BAFASH)
	// "4C grades with at least a D in any other two subjects. At least a D in English Language and submission of portfolio, a credit in any of the below subjects is an added advantage: Art, Woodwork, Home Economics, Art and Design and Design and Technology and Needlework. A diploma in any relevant field or TVET certificate in any relevant field from a recognized institution or N4 in any relevant field."
	requirements.push({
		programId: P('BAFASH'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: { count: 4, grade: 'C' },
			requiredSubjects: [{ subjectId: ENG, minimumGrade: 'D' }],
			optionalSubjectGroups: [
				{
					name: 'Design Subjects (Advantageous)',
					subjectIds: designSubjects,
					minimumGrade: 'C',
					required: false,
				},
			],
		},
	});
	requirements.push({
		programId: P('BAFASH'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			requiredQualificationName:
				'Diploma in a relevant field or TVET certificate or N4',
		},
	});

	// Insert all requirements
	if (requirements.length > 0) {
		await db
			.insert(entryRequirements)
			.values(requirements)
			.onConflictDoNothing();
		console.log(`✅ Seeded ${requirements.length} entry requirements.`);
	}
}
