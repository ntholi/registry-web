import type { ActivityType } from '@/app/admin/activity-tracker/_lib/activity-catalog';
import { getActiveTerm } from '@/app/registry/terms';
import type {
	studentModules,
	studentPrograms,
	studentSemesters,
	students,
} from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth, { requireSessionUserId } from '@/core/platform/withAuth';
import type { Program } from '@/shared/lib/utils/grades/type';
import type { StudentFilter } from './actions';
import StudentRepository from './repository';

type Student = typeof students.$inferInsert;

class StudentService {
	private repository: StudentRepository;

	constructor() {
		this.repository = new StudentRepository();
	}

	async get(stdNo: number) {
		return withAuth(async () => {
			return this.repository.findById(stdNo);
		}, ['dashboard']);
	}

	async getAcademicHistory(stdNo: number, excludedTerms: string[] = []) {
		return withAuth(async () => {
			const data = await this.repository.findAcademicHistory(stdNo);
			if (excludedTerms.length === 0 || !data) return data;

			return {
				...data,
				programs: removeTermsFromPrograms(data.programs, excludedTerms),
			};
		}, ['academic', 'registry', 'finance', 'student']);
	}

	async getRegistrationData(stdNo: number) {
		return withAuth(
			async () => this.repository.findRegistrationData(stdNo),
			async (session) =>
				session.user?.stdNo === stdNo ||
				['academic', 'registry', 'finance'].includes(session.user?.role || '')
		);
	}

	async getRegistrationDataByTerm(stdNo: number, termCode: string) {
		return withAuth(
			async () => this.repository.findRegistrationDataByTerm(stdNo, termCode),
			async (session) =>
				session.user?.stdNo === stdNo ||
				['academic', 'registry', 'finance'].includes(session.user?.role || '')
		);
	}

	async findStudentByUserId(userId: string) {
		return withAuth(async () => {
			return await this.repository.findStudentByUserId(userId);
		}, ['dashboard']);
	}

	async findBySemesterModules(semesterModuleIds: number[]) {
		const term = await getActiveTerm();
		return withAuth(
			async () =>
				this.repository.findBySemesterModules(semesterModuleIds, term.code),
			['dashboard']
		);
	}

	async findAll(
		params: QueryOptions<typeof students> & { filter?: StudentFilter }
	) {
		return withAuth(
			async () => this.repository.queryBasic(params),
			async (session) => {
				if (
					session.user?.role &&
					[
						'admin',
						'registry',
						'finance',
						'library',
						'student_services',
						'academic',
						'resource',
						'marketing',
						'leap',
					].includes(session.user.role)
				) {
					return true;
				}

				if (session.user?.position) {
					return ['admin', 'manager', 'program_leader', 'year_leader'].includes(
						session.user.position
					);
				}
				return false;
			}
		);
	}

	async create(data: Student) {
		return withAuth(
			async (session) =>
				this.repository.create(data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'student_creation',
					stdNo: data.stdNo,
				}),
			[]
		);
	}

	async update(stdNo: number, data: Student) {
		return withAuth(
			async (session) =>
				this.repository.update(stdNo, data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'student_update',
					stdNo,
				}),
			[]
		);
	}

	async updateUserId(stdNo: number, userId: string | null) {
		return withAuth(
			async (session) =>
				this.repository.updateUserId(stdNo, userId, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'student_update',
					stdNo,
				}),
			['admin', 'registry']
		);
	}

	async updateProgramStructure(stdNo: number, structureId: number) {
		return withAuth(
			async (session) =>
				this.repository.updateProgramStructure(stdNo, structureId, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'student_program_structure_changed',
					stdNo,
				}),
			['admin', 'registry']
		);
	}

	async getStudentPrograms(stdNo: number): Promise<Program[]> {
		return withAuth(async () => {
			const student = await this.repository.findStudentByStdNo(stdNo);
			return student?.programs || [];
		}, ['dashboard', 'student']);
	}

	async updateWithReasons(
		stdNo: number,
		data: Partial<Student>,
		reasons?: string
	) {
		return withAuth(
			async (session) =>
				this.repository.updateStudentWithAudit(stdNo, data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'student_update',
					stdNo,
					metadata: reasons ? { reasons } : undefined,
				}),
			['registry', 'admin']
		);
	}

	async updateStudentProgram(
		id: number,
		data: Partial<typeof studentPrograms.$inferInsert>,
		stdNo: number,
		reasons?: string
	) {
		return withAuth(
			async (session) =>
				this.repository.updateStudentProgram(id, data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: resolveStudentProgramActivityType(data.status),
					stdNo,
					metadata: reasons ? { reasons } : undefined,
				}),
			['registry', 'admin']
		);
	}

	async createStudentProgram(
		data: typeof studentPrograms.$inferInsert,
		reasons?: string
	) {
		return withAuth(
			async (session) =>
				this.repository.createStudentProgram(data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'program_enrollment',
					stdNo: data.stdNo,
					metadata: reasons ? { reasons } : undefined,
				}),
			['registry', 'admin']
		);
	}

	async updateStudentSemester(
		id: number,
		data: Partial<typeof studentSemesters.$inferInsert>,
		stdNo: number,
		reasons?: string
	) {
		return withAuth(
			async (session) =>
				this.repository.updateStudentSemester(id, data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: resolveStudentSemesterActivityType(data.status),
					stdNo,
					metadata: reasons ? { reasons } : undefined,
				}),
			['registry', 'admin']
		);
	}

	async updateStudentModule(
		id: number,
		data: Partial<typeof studentModules.$inferInsert>,
		stdNo: number,
		reasons?: string
	) {
		return withAuth(
			async (session) =>
				this.repository.updateStudentModule(id, data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: resolveStudentModuleActivityType(data.status),
					stdNo,
					metadata: reasons ? { reasons } : undefined,
				}),
			['registry', 'admin']
		);
	}
}

function resolveStudentProgramActivityType(status?: string): ActivityType {
	switch (status) {
		case 'Completed':
			return 'program_completed';
		case 'Active':
			return 'program_activated';
		case 'Changed':
			return 'program_change';
		case 'Deleted':
			return 'program_deleted';
		case 'Inactive':
			return 'program_deactivated';
		default:
			return 'program_enrollment';
	}
}

function resolveStudentSemesterActivityType(status?: string): ActivityType {
	switch (status) {
		case 'Active':
			return 'semester_activated';
		case 'Deferred':
			return 'semester_deferred';
		case 'DroppedOut':
			return 'semester_dropout';
		case 'Deleted':
			return 'semester_deleted';
		case 'Withdrawn':
			return 'semester_withdrawal';
		case 'Repeat':
			return 'semester_repeat';
		case 'Inactive':
			return 'semester_deactivated';
		default:
			return 'semester_activated';
	}
}

function resolveStudentModuleActivityType(status?: string): ActivityType {
	switch (status) {
		case 'Drop':
			return 'module_dropped';
		case 'Delete':
			return 'module_deleted';
		case 'Repeat1':
		case 'Repeat2':
		case 'Repeat3':
			return 'module_repeated';
		default:
			return 'module_update';
	}
}

function removeTermsFromPrograms(programs: Program[], termCodes: string[]) {
	const excludeSet = new Set(termCodes);
	return programs.map((program) => ({
		...program,
		semesters:
			program.semesters?.filter(
				(semester) => !excludeSet.has(semester.termCode)
			) || [],
	}));
}

export const studentsService = serviceWrapper(
	StudentService,
	'StudentsService'
);
