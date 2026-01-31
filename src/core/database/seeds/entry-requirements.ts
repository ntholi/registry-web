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
	const DIPLOMA = C('Diploma');

	const MATH = S('Mathematics');
	const ENG = S('English Language');
	const LIT = S('Literature in English');
	const ACC = S('Accounting');
	const BUS = S('Business Studies');
	const ECON = S('Economics');
	const ART = S('Art');
	const WOODWORK = S('Woodwork');
	const HOME_ECON = S('Home Economics');
	const ART_DESIGN = S('Art and Design');
	const DESIGN_TECH = S('Design and Technology');
	const NEEDLEWORK = S('Needlework');
	const TECH_DRAWING = S('Technical Drawing');
	const GEO = S('Geography');
	const DRAMA = S('Drama');
	const COMMERCE = S('Commerce');

	const commercialSubjects = [ACC, BUS, ECON, COMMERCE];
	const designSubjects = [
		ART,
		ART_DESIGN,
		DESIGN_TECH,
		HOME_ECON,
		NEEDLEWORK,
		WOODWORK,
	];
	const architectureSubjects = [
		ART,
		WOODWORK,
		ART_DESIGN,
		DESIGN_TECH,
		TECH_DRAWING,
	];

	// ============================================================
	// FACULTY OF DESIGN & INNOVATION
	// ============================================================

	// Diploma in Creative Advertising (DCA)
	// 3 C grades and 2 D passes with at least D in English. C in design subjects is advantageous.
	requirements.push({
		programId: P('DCA'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 3, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [
				{ subjectId: ENG, minimumGrade: 'D', required: true },
				...designSubjects.map((subjectId) => ({
					subjectId,
					minimumGrade: 'C',
					required: false,
				})),
			],
		},
	});
	requirements.push({
		programId: P('DCA'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Creative Advertising',
				'Associate Degree in Creative Advertising',
				'Associate Degree in Creative Multimedia',
				'Associate Degree in Graphic Design',
				'Associate Degree in Digital Photography',
			],
		},
	});

	// Diploma in Graphic Design (DGD)
	// 3 C grades and 2 D passes with at least D in English. C in design subjects is advantageous.
	requirements.push({
		programId: P('DGD'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 3, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [
				{ subjectId: ENG, minimumGrade: 'D', required: true },
				...designSubjects.map((subjectId) => ({
					subjectId,
					minimumGrade: 'C',
					required: false,
				})),
			],
		},
	});
	requirements.push({
		programId: P('DGD'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Graphic Design',
				'Associate Degree in Graphic Design',
				'Associate Degree in Creative Multimedia',
				'Associate Degree in Packaging and Design',
				'Associate Degree in Fine Art',
			],
		},
	});

	// Diploma in Fashion and Apparel Design (DFAD)
	// 3 C grades and 2 D passes with at least D in English. C in design subjects is advantageous.
	requirements.push({
		programId: P('DFAD'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 3, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [
				{ subjectId: ENG, minimumGrade: 'D', required: true },
				...[ART, ART_DESIGN, DESIGN_TECH, HOME_ECON, NEEDLEWORK].map(
					(subjectId) => ({
						subjectId,
						minimumGrade: 'C',
						required: false,
					})
				),
			],
		},
	});
	requirements.push({
		programId: P('DFAD'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Fashion & Apparel Design',
				'Associate Degree in Fashion & Apparel Design',
				'Associate Degree in Merchandising & Retailing',
				'Associate Degree in Textile Design',
				'Associate Degree in Accessories Design',
			],
		},
	});

	// BA in Fashion & Retailing (BAFASH)
	// 4 C grades and 2 D passes including C in English Language or English Literature.
	requirements.push({
		programId: P('BAFASH'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 4, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [],
			subjectGroups: [
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
		programId: P('BAFASH'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Fashion & Apparel Design',
				'Diploma in Retail Management',
				'Diploma in Marketing',
				'Associate Degree in Fashion & Apparel Design',
				'Associate Degree in Merchandising & Retailing',
				'Associate Degree in Retail Management',
			],
		},
	});

	// ============================================================
	// FACULTY OF ARCHITECTURE AND THE BUILT ENVIRONMENT
	// ============================================================

	// BA in Architectural Studies (BAS)
	// 4 C grades and 2 D passes including C in English Language or English Literature and D in Mathematics.
	// C in Art, Woodwork, Art & Design, Design & Technology, Technical Drawing is advantageous.
	requirements.push({
		programId: P('BAS'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 4, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [{ subjectId: MATH, minimumGrade: 'D', required: true }],
			subjectGroups: [
				{
					name: 'English/Literature',
					subjectIds: [ENG, LIT],
					minimumGrade: 'C',
					required: true,
				},
				{
					name: 'Architecture Subjects',
					subjectIds: architectureSubjects,
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
			courses: [
				'Diploma in Architecture Technology',
				'Associate Degree in Architecture Technology',
				'Associate Degree in Interior Design',
			],
		},
	});

	// Diploma in Architectural Technology (DAT)
	// 3 C grades and 2 D passes with at least D in Mathematics and English Language.
	// C in Art, Woodwork, Design & Technology, Technical Drawing is advantageous.
	requirements.push({
		programId: P('DAT'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 3, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [
				{ subjectId: MATH, minimumGrade: 'D', required: true },
				{ subjectId: ENG, minimumGrade: 'D', required: true },
			],
			subjectGroups: [
				{
					name: 'Architecture Subjects',
					subjectIds: architectureSubjects,
					minimumGrade: 'C',
					required: false,
				},
			],
		},
	});
	requirements.push({
		programId: P('DAT'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Architecture Technology',
				'Associate Degree in Architecture Technology',
			],
		},
	});

	// ============================================================
	// FACULTY OF BUSINESS AND GLOBALIZATION
	// ============================================================

	// B.Bus in International Business (BIB)
	// 4 C grades with C in English Language and Commercial subjects (Accounting, Economics) and 2 D passes including Mathematics.
	requirements.push({
		programId: P('BIB'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 4, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [
				{ subjectId: ENG, minimumGrade: 'C', required: true },
				{ subjectId: MATH, minimumGrade: 'D', required: true },
			],
			subjectGroups: [
				{
					name: 'Commercial Subjects',
					subjectIds: commercialSubjects,
					minimumGrade: 'C',
					required: true,
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
			courses: [
				'Diploma in Business Management',
				'Diploma in Business Information Technology',
				'Diploma in Marketing',
				'Associate Degree in Business Management',
				'Associate Degree in Business Information Systems',
				'Associate Degree in Business Information Technology',
				'Associate Degree in Marketing',
			],
		},
	});

	// B.Bus in Entrepreneurship (BEN)
	// 4 C grades with C in English Language and Commercial subjects (Accounting, Economics) and 2 D passes including Mathematics.
	requirements.push({
		programId: P('BEN'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 4, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [
				{ subjectId: ENG, minimumGrade: 'C', required: true },
				{ subjectId: MATH, minimumGrade: 'D', required: true },
			],
			subjectGroups: [
				{
					name: 'Commercial Subjects',
					subjectIds: commercialSubjects,
					minimumGrade: 'C',
					required: true,
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
			courses: [
				'Diploma in Business Management',
				'Diploma in Business Information Technology',
				'Diploma in Marketing',
				'Diploma in Retail Management',
				'Associate Degree in Business Management',
				'Associate Degree in Business Information Systems',
				'Associate Degree in Marketing',
			],
		},
	});

	// BA in Human Resource Management (BHR)
	// 4 C grades with C in English Language and Commercial subjects (Accounting, Economics) and 2 D passes including Mathematics.
	requirements.push({
		programId: P('BHR'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 4, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [
				{ subjectId: ENG, minimumGrade: 'C', required: true },
				{ subjectId: MATH, minimumGrade: 'D', required: true },
			],
			subjectGroups: [
				{
					name: 'Commercial Subjects',
					subjectIds: commercialSubjects,
					minimumGrade: 'C',
					required: true,
				},
			],
		},
	});
	requirements.push({
		programId: P('BHR'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Business Management',
				'Diploma in Marketing',
				'Diploma in Business Information Technology',
				'Associate Degree in Business Management',
				'Associate Degree in Marketing',
			],
		},
	});

	// Diploma in Business Management (DBM)
	// 3 C grades with C in Commercial subjects and 2 D passes including Mathematics and English Language.
	requirements.push({
		programId: P('DBM'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 3, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [
				{ subjectId: MATH, minimumGrade: 'D', required: true },
				{ subjectId: ENG, minimumGrade: 'D', required: true },
			],
			subjectGroups: [
				{
					name: 'Commercial Subjects',
					subjectIds: commercialSubjects,
					minimumGrade: 'C',
					required: true,
				},
			],
		},
	});
	requirements.push({
		programId: P('DBM'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Business Management',
				'Diploma in Marketing',
				'Associate Degree in Business Management',
				'Associate Degree in Business Information Systems',
				'Associate Degree in Marketing',
			],
		},
	});

	// Diploma in Retail Management (DRM)
	// 3 C grades with C in Commercial subjects and 2 D passes including Mathematics and English Language.
	requirements.push({
		programId: P('DRM'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 3, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [
				{ subjectId: MATH, minimumGrade: 'D', required: true },
				{ subjectId: ENG, minimumGrade: 'D', required: true },
			],
			subjectGroups: [
				{
					name: 'Commercial Subjects',
					subjectIds: commercialSubjects,
					minimumGrade: 'C',
					required: true,
				},
			],
		},
	});
	requirements.push({
		programId: P('DRM'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Retail Management',
				'Diploma in Marketing',
				'Associate Degree in Retail Management',
				'Associate Degree in Merchandising & Retailing',
				'Associate Degree in Retail Design & Management',
			],
		},
	});

	// Diploma in Marketing (DMK)
	// 3 C grades with C in Commercial subjects and 2 D passes including Mathematics and English Language.
	requirements.push({
		programId: P('DMK'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 3, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [
				{ subjectId: MATH, minimumGrade: 'D', required: true },
				{ subjectId: ENG, minimumGrade: 'D', required: true },
			],
			subjectGroups: [
				{
					name: 'Commercial Subjects',
					subjectIds: commercialSubjects,
					minimumGrade: 'C',
					required: true,
				},
			],
		},
	});
	requirements.push({
		programId: P('DMK'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Marketing',
				'Diploma in Business Management',
				'Associate Degree in Marketing',
				'Associate Degree in Business Management',
			],
		},
	});

	// ============================================================
	// FACULTY OF CREATIVITY IN TOURISM AND HOSPITALITY
	// ============================================================

	// BA in Tourism Management (BTM)
	// 4 C grades with C in English Language or English Literature and 2 D passes including Geography.
	requirements.push({
		programId: P('BTM'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 4, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [{ subjectId: GEO, minimumGrade: 'D', required: false }],
			subjectGroups: [
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
		programId: P('BTM'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Tourism Management',
				'Diploma in International Tourism',
				'Diploma in Hotel Management',
				'Diploma in Events Management',
				'Associate Degree in Tourism Management',
				'Associate Degree in International Tourism',
				'Associate Degree in Hotel Management',
				'Associate Degree in Event Management',
			],
		},
	});

	// Diploma in Tourism Management (DTM)
	// 3 C grades and 2 D passes including D in English Language or English Literature and Geography.
	requirements.push({
		programId: P('DTM'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 3, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [{ subjectId: GEO, minimumGrade: 'D', required: false }],
			subjectGroups: [
				{
					name: 'English/Literature',
					subjectIds: [ENG, LIT],
					minimumGrade: 'D',
					required: true,
				},
			],
		},
	});
	requirements.push({
		programId: P('DTM'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Tourism Management',
				'Diploma in International Tourism',
				'Associate Degree in Tourism Management',
				'Associate Degree in International Tourism',
			],
		},
	});

	// Diploma in Hotel Management (DHM)
	// 3 C grades and 2 D passes including D in English Language or English Literature and Geography.
	requirements.push({
		programId: P('DHM'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 3, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [{ subjectId: GEO, minimumGrade: 'D', required: false }],
			subjectGroups: [
				{
					name: 'English/Literature',
					subjectIds: [ENG, LIT],
					minimumGrade: 'D',
					required: true,
				},
			],
		},
	});
	requirements.push({
		programId: P('DHM'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Hotel Management',
				'Diploma in Tourism Management',
				'Associate Degree in Hotel Management',
				'Associate Degree in Tourism Management',
			],
		},
	});

	// Diploma in Events Management (DEM)
	// 3 C grades and 2 D passes including D in English Language or English Literature and Geography.
	requirements.push({
		programId: P('DEM'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 3, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [{ subjectId: GEO, minimumGrade: 'D', required: false }],
			subjectGroups: [
				{
					name: 'English/Literature',
					subjectIds: [ENG, LIT],
					minimumGrade: 'D',
					required: true,
				},
			],
		},
	});
	requirements.push({
		programId: P('DEM'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Events Management',
				'Diploma in Tourism Management',
				'Associate Degree in Event Management',
				'Associate Degree in Tourism Management',
			],
		},
	});

	// ============================================================
	// FACULTY OF COMMUNICATION, MEDIA AND BROADCASTING
	// ============================================================

	// BA in Professional Communication (BPC)
	// 4 C grades including English Language or English Literature and 2 D passes.
	requirements.push({
		programId: P('BPC'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 4, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [],
			subjectGroups: [
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
			courses: [
				'Diploma in Public Relations',
				'Diploma in Journalism & Media',
				'Diploma in Broadcasting Radio & TV',
				'Associate Degree in Public Relations',
				'Associate Degree in Journalism & Media',
				'Associate Degree in Broadcasting (Radio & TV)',
			],
		},
	});

	// BA in Broadcasting & Journalism (BBJ)
	// 4 C grades including English Language or English Literature and 2 D passes.
	requirements.push({
		programId: P('BBJ'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 4, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [],
			subjectGroups: [
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
			courses: [
				'Diploma in Broadcasting Radio & TV',
				'Diploma in Journalism & Media',
				'Diploma in Film Production',
				'Associate Degree in Broadcasting (Radio & TV)',
				'Associate Degree in Journalism & Media',
				'Associate Degree in Film Production',
			],
		},
	});

	// BA in Digital Film and Television (BDF)
	// 4 C grades including English Language or English Literature and 2 D passes.
	requirements.push({
		programId: P('BDF'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 4, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [],
			subjectGroups: [
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
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Film Production',
				'Diploma in Broadcasting Radio & TV',
				'Diploma in Journalism & Media',
				'Associate Degree in Film Production',
				'Associate Degree in Digital Video',
				'Associate Degree in Videography',
			],
		},
	});

	// Diploma in Television and Film Production (DFP)
	// 3 C grades and 2 D passes including C in English Language and English Literature.
	requirements.push({
		programId: P('DFP'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 3, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [
				{ subjectId: ENG, minimumGrade: 'C', required: true },
				{ subjectId: LIT, minimumGrade: 'C', required: true },
				{ subjectId: DRAMA, minimumGrade: 'C', required: false },
			],
		},
	});
	requirements.push({
		programId: P('DFP'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Film Production',
				'Associate Degree in Film Production',
				'Associate Degree in Digital Video',
				'Associate Degree in Videography',
			],
		},
	});

	// Diploma in Broadcasting (Radio and TV) (DBRTV)
	// 3 C grades and 2 D passes including C in English Language and English Literature.
	requirements.push({
		programId: P('DBRTV'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 3, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [
				{ subjectId: ENG, minimumGrade: 'C', required: true },
				{ subjectId: LIT, minimumGrade: 'C', required: true },
			],
		},
	});
	requirements.push({
		programId: P('DBRTV'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Broadcasting Radio & TV',
				'Diploma in Film Production',
				'Associate Degree in Broadcasting (Radio & TV)',
				'Associate Degree in Digital Video',
			],
		},
	});

	// Diploma in Public Relations (DPR)
	// 3 C grades and 2 D passes including C in English Language and English Literature.
	requirements.push({
		programId: P('DPR'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 3, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [
				{ subjectId: ENG, minimumGrade: 'C', required: true },
				{ subjectId: LIT, minimumGrade: 'C', required: true },
			],
		},
	});
	requirements.push({
		programId: P('DPR'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Public Relations',
				'Diploma in Journalism & Media',
				'Associate Degree in Public Relations',
				'Associate Degree in Journalism & Media',
			],
		},
	});

	// Diploma in Journalism and Media (DJM)
	// 3 C grades and 2 D passes including C in English Language and English Literature.
	requirements.push({
		programId: P('DJM'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 3, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [
				{ subjectId: ENG, minimumGrade: 'C', required: true },
				{ subjectId: LIT, minimumGrade: 'C', required: true },
			],
		},
	});
	requirements.push({
		programId: P('DJM'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Journalism & Media',
				'Diploma in Public Relations',
				'Associate Degree in Journalism & Media',
				'Associate Degree in Public Relations',
			],
		},
	});

	// ============================================================
	// FACULTY OF INFORMATION AND COMMUNICATION TECHNOLOGY
	// ============================================================

	// BSc in Software Engineering with Multimedia (BSCSM)
	// 4 C grades including English Language or English Literature and 2 D passes. C or better in Mathematics.
	requirements.push({
		programId: P('BSCSM'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 4, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [{ subjectId: MATH, minimumGrade: 'C', required: true }],
			subjectGroups: [
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
		programId: P('BSCSM'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Multimedia & Software Engineering',
				'Diploma in Information Technology',
				'Diploma in Business Information Technology',
				'Associate Degree in Multimedia & Software Engineering',
				'Associate Degree in Information Technology',
				'Associate Degree in Software Engineering',
			],
		},
	});

	// BSc in Business Information Technology (BSCBIT)
	// 4 C grades including English Language or English Literature and 2 D passes. C or better in Mathematics. C or better in Commercial subjects.
	requirements.push({
		programId: P('BSCBIT'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 4, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [{ subjectId: MATH, minimumGrade: 'C', required: true }],
			subjectGroups: [
				{
					name: 'English/Literature',
					subjectIds: [ENG, LIT],
					minimumGrade: 'C',
					required: true,
				},
				{
					name: 'Commercial Subjects',
					subjectIds: commercialSubjects,
					minimumGrade: 'C',
					required: true,
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
			courses: [
				'Diploma in Business Information Technology',
				'Diploma in Information Technology',
				'Diploma in Business Management',
				'Associate Degree in Business Information Technology',
				'Associate Degree in Business Information Systems',
				'Associate Degree in Information Technology',
			],
		},
	});

	// BSc in Information Technology (BSCIT)
	// 4 C grades including English Language or English Literature and 2 D passes. C or better in Mathematics.
	requirements.push({
		programId: P('BSCIT'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 4, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [{ subjectId: MATH, minimumGrade: 'C', required: true }],
			subjectGroups: [
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
		programId: P('BSCIT'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Information Technology',
				'Diploma in Business Information Technology',
				'Diploma in Multimedia & Software Engineering',
				'Associate Degree in Information Technology',
				'Associate Degree in Business Information Technology',
				'Associate Degree in Multimedia & Software Engineering',
			],
		},
	});

	// Diploma in Multimedia and Software Engineering (DMSE)
	// 3 C grades and 2 D passes. C or better in Mathematics.
	requirements.push({
		programId: P('DMSE'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 3, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [{ subjectId: MATH, minimumGrade: 'C', required: true }],
		},
	});
	requirements.push({
		programId: P('DMSE'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Multimedia & Software Engineering',
				'Associate Degree in Multimedia & Software Engineering',
				'Associate Degree in Software Engineering',
				'Associate Degree in Mobile Computing',
				'Associate Degree in Web Design',
			],
		},
	});

	// Diploma in Business Information Technology (DBIT)
	// 3 C grades and 2 D passes. C or better in Mathematics. C or better in Commercial/Financial subjects.
	requirements.push({
		programId: P('DBIT'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 3, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [{ subjectId: MATH, minimumGrade: 'C', required: true }],
			subjectGroups: [
				{
					name: 'Commercial/Financial Subjects',
					subjectIds: commercialSubjects,
					minimumGrade: 'C',
					required: true,
				},
			],
		},
	});
	requirements.push({
		programId: P('DBIT'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Business Information Technology',
				'Diploma in Information Technology',
				'Associate Degree in Business Information Technology',
				'Associate Degree in Business Information Systems',
				'Associate Degree in Information Technology',
			],
		},
	});

	// Diploma in Information Technology (DIT)
	// 3 C grades and 2 D passes. C or better in Mathematics.
	requirements.push({
		programId: P('DIT'),
		certificateTypeId: LGCSE,
		rules: {
			type: 'subject-grades',
			minimumGrades: [
				{ count: 3, grade: 'C' },
				{ count: 2, grade: 'D' },
			],
			subjects: [{ subjectId: MATH, minimumGrade: 'C', required: true }],
		},
	});
	requirements.push({
		programId: P('DIT'),
		certificateTypeId: DIPLOMA,
		rules: {
			type: 'classification',
			minimumClassification: 'Pass',
			courses: [
				'Diploma in Information Technology',
				'Associate Degree in Information Technology',
				'Associate Degree in Business Information Technology',
				'Associate Degree in Multimedia & Software Engineering',
			],
		},
	});

	if (requirements.length > 0) {
		await db
			.insert(entryRequirements)
			.values(requirements)
			.onConflictDoNothing();
		console.log(`✅ Seeded ${requirements.length} entry requirements.`);
	}
}
