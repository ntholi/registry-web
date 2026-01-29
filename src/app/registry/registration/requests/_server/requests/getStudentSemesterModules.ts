import {
	type AcademicRemarks,
	getActiveProgram,
	getNextSemesterNo,
	type Student,
} from '@registry/students';
import { and, eq, inArray } from 'drizzle-orm';
import {
	db,
	modulePrerequisites,
	type modules,
	semesterModules,
	structureSemesters,
} from '@/core/database';
import { isActiveModule, isActiveSemester } from '@/shared/lib/utils/utils';

function normalizeName(name: string | undefined | null): string {
	return (name ?? '').trim().replace(/\s+/g, ' ');
}

type ModuleWithStatus = {
	semesterModuleId: number;
	code: string;
	name: string;
	type: string;
	credits: number;
	status: 'Compulsory' | 'Elective' | `Repeat${number}`;
	semesterNo: string;
	prerequisites?: Module[];
};

type Module = {
	id: number;
	code: string;
	name: string;
};

type SemesterModuleWithModule = typeof semesterModules.$inferSelect & {
	module: typeof modules.$inferSelect;
	semester: { semesterNumber: string };
};

export async function getStudentSemesterModulesLogic(
	student: Student,
	remarks: AcademicRemarks
) {
	if (!student) {
		return {
			error: 'Student not found',
			modules: [],
		};
	}

	const activeProgram = getActiveProgram(student);
	if (!activeProgram) {
		return {
			error: 'No active program found for student',
			modules: [],
		};
	}

	const failedPrerequisites = await getFailedPrerequisites(
		remarks.failedModules
	);
	const repeatModules = await getRepeatModules(
		remarks.failedModules,
		getNextSemesterNo(student),
		activeProgram.structureId
	);

	if (remarks.status === 'Remain in Semester') {
		return {
			error: `${remarks.status}, ${remarks.details}`,
			modules: repeatModules,
		};
	}

	const attemptedModules = new Set(
		student.programs
			.flatMap((p) => p.semesters)
			.filter((s) => isActiveSemester(s.status))
			.flatMap((s) => s.studentModules)
			.filter((m) => isActiveModule(m.status))
			.map((m) => normalizeName(m.semesterModule.module?.name))
	);

	const eligibleModules = await getSemesterModules(
		getNextSemesterNo(student),
		activeProgram.structureId
	);

	const filteredModules = eligibleModules.filter(
		(m) => !attemptedModules.has(normalizeName(m.module?.name))
	);

	const modules = [
		...filteredModules.map(
			(m): ModuleWithStatus => ({
				semesterModuleId: m.id,
				code: m.module.code,
				name: m.module.name,
				type: m.type,
				credits: m.credits,
				status: m.type === 'Elective' ? 'Elective' : 'Compulsory',
				semesterNo: m.semester.semesterNumber,
				prerequisites: failedPrerequisites[normalizeName(m.module?.name)] || [],
			})
		),
		...repeatModules,
	];

	return { modules, error: null };
}

async function getFailedPrerequisites(failedModules: Module[]) {
	if (failedModules.length === 0) {
		return {};
	}

	const failedModulesByName = failedModules.reduce(
		(acc, module) => {
			acc[normalizeName(module.name)] = module;
			return acc;
		},
		{} as Record<string, Module>
	);

	const failedSemesterModules = await db.query.semesterModules.findMany({
		where: inArray(
			semesterModules.moduleId,
			failedModules.map((m) => m.id)
		),
		columns: { id: true },
	});

	const prerequisites = await db.query.modulePrerequisites.findMany({
		where: inArray(
			modulePrerequisites.prerequisiteId,
			failedSemesterModules.map((sm) => sm.id)
		),
		with: {
			semesterModule: { with: { module: true } },
			prerequisite: { with: { module: true } },
		},
	});

	return prerequisites.reduce(
		(acc, { semesterModule: { module }, prerequisite }) => {
			const prereqName = normalizeName(prerequisite.module?.name);
			const modName = normalizeName(module?.name);
			if (module && prerequisite.module && failedModulesByName[prereqName]) {
				acc[modName] = acc[modName] || [];
				const pModule = failedModulesByName[prereqName];

				if (
					!acc[modName].some(
						(p) => normalizeName(p.name) === normalizeName(pModule.name)
					)
				) {
					acc[modName].push(pModule);
				}
			}
			return acc;
		},
		{} as Record<string, Module[]>
	);
}

async function getRepeatModules(
	failedModules: Module[],
	nextSemester: string,
	structureId: number
) {
	if (failedModules.length === 0) return [];

	const failedModuleNames = failedModules.map((m) => normalizeName(m.name));
	const failedPrerequisites = await getFailedPrerequisites(failedModules);
	const nextSemNum = Number.parseInt(nextSemester, 10);
	const targetSemesters =
		nextSemNum % 2 === 0
			? ['02', '04', '06', '08', '2', '4', '6', '8']
			: ['01', '03', '05', '07', '1', '3', '5', '7'];

	const allSemesterModules = await getSemesterModulesMultiple(
		targetSemesters,
		structureId
	);

	const repeatSemesterModules = allSemesterModules.filter(
		(sm) =>
			sm.module && failedModuleNames.includes(normalizeName(sm.module.name))
	);

	const seenIds = new Set<number>();
	const allRepeatModules: ModuleWithStatus[] = [];

	for (const sm of repeatSemesterModules) {
		if (seenIds.has(sm.id)) continue;
		seenIds.add(sm.id);

		allRepeatModules.push({
			semesterModuleId: sm.id,
			code: sm.module!.code,
			name: sm.module!.name,
			type: sm.type,
			credits: sm.credits,
			status: `Repeat${allRepeatModules.length + 1}` as const,
			semesterNo: sm.semester.semesterNumber,
			prerequisites: failedPrerequisites[normalizeName(sm.module!.name)] || [],
		});
	}

	return allRepeatModules;
}

async function getSemesterModules(semesterNumber: string, structureId: number) {
	const semNum = Number.parseInt(semesterNumber, 10);
	const semesterNos = (semNum % 2 === 0 ? [2, 4, 6, 8] : [1, 3, 5, 7]).filter(
		(s) => s <= semNum
	);

	const semesters = await db.query.structureSemesters.findMany({
		where: and(
			eq(structureSemesters.structureId, structureId),
			inArray(structureSemesters.semesterNumber, [
				...semesterNos.map(String),
				...semesterNos.map((s) => s.toString().padStart(2, '0')),
			])
		),
	});

	const semesterIds = semesters.map((s) => s.id);
	if (semesterIds.length === 0) return [];

	const data = await db.query.semesterModules.findMany({
		with: {
			module: true,
			semester: {
				columns: { semesterNumber: true },
			},
		},
		where: and(
			inArray(semesterModules.semesterId, semesterIds),
			eq(semesterModules.hidden, false)
		),
	});

	return data.filter(
		(m) => m.module !== null && m.semester !== null
	) as SemesterModuleWithModule[];
}

async function getSemesterModulesMultiple(
	semesterNumbers: string[],
	structureId: number
) {
	const semesters = await db.query.structureSemesters.findMany({
		where: and(
			eq(structureSemesters.structureId, structureId),
			inArray(structureSemesters.semesterNumber, semesterNumbers)
		),
	});

	const semesterIds = semesters.map((s) => s.id);
	if (semesterIds.length === 0) return [];

	const data = await db.query.semesterModules.findMany({
		with: {
			module: true,
			semester: {
				columns: { semesterNumber: true },
			},
		},
		where: and(
			inArray(semesterModules.semesterId, semesterIds),
			eq(semesterModules.hidden, false)
		),
	});

	return data.filter(
		(m) => m.module !== null && m.semester !== null
	) as SemesterModuleWithModule[];
}
