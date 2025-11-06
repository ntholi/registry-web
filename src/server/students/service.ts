import type { students } from '@/db/schema';
import { serviceWrapper } from '@/server/base/serviceWrapper';
import withAuth from '@/server/base/withAuth';
import type { Program } from '@/utils/grades/type';
import type { QueryOptions } from '../base/BaseRepository';
import { getCurrentTerm } from '../terms/actions';
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
				programs: removeTermFromPrograms(data.programs, currentTerm.name),
			};
		}, ['academic', 'registry', 'finance', 'student']);
	}

	async getRegistrationData(stdNo: number) {
		return withAuth(
			async () => this.repository.findRegistrationData(stdNo),
			['academic', 'registry', 'finance'],
			async (session) =>
				session.user?.stdNo === stdNo ||
				['academic', 'registry', 'finance'].includes(session.user?.role || '')
		);
	}

	async getRegistrationDataByTerm(stdNo: number, termName: string) {
		return withAuth(
			async () => this.repository.findRegistrationDataByTerm(stdNo, termName),
			['academic', 'registry', 'finance', 'student'],
			async (session) => session.user?.stdNo === stdNo
		);
	}

	async findStudentByUserId(userId: string) {
		return withAuth(async () => {
			return await this.repository.findStudentByUserId(userId);
		}, ['auth']);
	}

	async findByModuleId(moduleId: number) {
		const term = await getCurrentTerm();
		return withAuth(
			async () => this.repository.findByModuleId(moduleId, term.name),
			['dashboard']
		);
	}

	async findAll(
		params: QueryOptions<typeof students> & { filter?: StudentFilter }
	) {
		return withAuth(
			async () => this.repository.queryBasic(params),
			['dashboard'],
			async (session) => {
				if (
					session.user?.role &&
					[
						'admin',
						'registry',
						'finance',
						'library',
						'student_services',
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

function removeTermFromPrograms(programs: Program[], termName: string) {
	return programs.map((program) => ({
		...program,
		semesters:
			program.semesters?.filter((semester) => semester.term !== termName) || [],
	}));
}

export const studentsService = serviceWrapper(
	StudentService,
	'StudentsService'
);
