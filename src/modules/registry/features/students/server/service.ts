import { getCurrentTerm } from '@registry/dates/terms';
import type { students } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type { Program } from '@/shared/lib/utils/grades/type';
import type { StudentFilter } from './actions';
import StudentRepository from './repository';

type Student = typeof students.$inferInsert;

class StudentService {
	private repository: StudentRepository;

	constructor() {
		this.repository = new StudentRepository();
	}

	async first() {
		return withAuth(async () => this.repository.findFirst(), []);
	}

	async get(stdNo: number) {
		return withAuth(async () => {
			return this.repository.findById(stdNo);
		}, ['dashboard']);
	}

	async getAcademicHistory(stdNo: number, excludeCurrentTerm: boolean = false) {
		return withAuth(async () => {
			const data = await this.repository.findAcademicHistory(stdNo);
			if (!excludeCurrentTerm) return data;

			const currentTerm = await getCurrentTerm();
			if (!data) return data;

			return {
				...data,
				programs: removeTermFromPrograms(data.programs, currentTerm.code),
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
		}, ['auth']);
	}

	async findBySemesterModules(semesterModuleIds: number[]) {
		const term = await getCurrentTerm();
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
		return withAuth(async () => this.repository.create(data), []);
	}

	async update(stdNo: number, data: Student) {
		return withAuth(async () => this.repository.update(stdNo, data), []);
	}

	async delete(stdNo: number) {
		return withAuth(async () => this.repository.delete(stdNo), []);
	}

	async updateUserId(stdNo: number, userId: string | null) {
		return withAuth(
			async () => this.repository.updateUserId(stdNo, userId),
			['admin', 'registry']
		);
	}

	async updateProgramStructure(stdNo: number, structureId: number) {
		return withAuth(
			async () => this.repository.updateProgramStructure(stdNo, structureId),
			['admin', 'registry']
		);
	}

	async count() {
		return withAuth(async () => this.repository.count(), []);
	}

	async getStudentPrograms(stdNo: number): Promise<Program[]> {
		return withAuth(async () => {
			const student = await this.repository.findStudentByStdNo(stdNo);
			return student?.programs || [];
		}, ['dashboard', 'student']);
	}
}

function removeTermFromPrograms(programs: Program[], termCode: string) {
	return programs.map((program) => ({
		...program,
		semesters:
			program.semesters?.filter((semester) => semester.termCode !== termCode) ||
			[],
	}));
}

export const studentsService = serviceWrapper(
	StudentService,
	'StudentsService'
);
