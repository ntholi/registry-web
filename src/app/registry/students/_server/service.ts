import { termsService } from '@registry/terms/_server/service';
import {
	resolveStudentModuleActivityType,
	resolveStudentProgramActivityType,
	resolveStudentSemesterActivityType,
} from '@/app/registry/_lib/activities';
import {
	hasAnyPermission,
	hasPermission,
} from '@/core/auth/sessionPermissions';
import type {
	nextOfKins,
	studentModules,
	studentPrograms,
	studentSemesters,
	students,
} from '@/core/database';
import { deleteFile, uploadFile } from '@/core/integrations/storage';
import { StoragePaths } from '@/core/integrations/storage-utils';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import {
	requireSessionUserId,
	withPermission,
} from '@/core/platform/withPermission';
import type { Program } from '@/shared/lib/utils/grades/type';
import type { AuditAttachmentInfo, StudentFilter } from './actions';
import StudentRepository from './repository';

type Student = typeof students.$inferInsert;

function buildAuditMetadata(
	reasons?: string,
	attachments?: AuditAttachmentInfo[]
): Record<string, unknown> | undefined {
	const meta: Record<string, unknown> = {};
	if (reasons) meta.reasons = reasons;
	if (attachments?.length) meta.attachments = attachments;
	return Object.keys(meta).length > 0 ? meta : undefined;
}

class StudentService {
	private repository: StudentRepository;

	constructor() {
		this.repository = new StudentRepository();
	}

	async get(stdNo: number) {
		return withPermission(
			async () => {
				return this.repository.findById(stdNo);
			},
			{ students: ['read'] }
		);
	}

	async getAcademicHistory(stdNo: number, excludedTerms: string[] = []) {
		return withPermission(
			async () => {
				const data = await this.repository.findAcademicHistory(stdNo);
				if (excludedTerms.length === 0 || !data) return data;

				return {
					...data,
					programs: removeTermsFromPrograms(data.programs, excludedTerms),
				};
			},
			async (session) =>
				session?.user?.stdNo === stdNo ||
				hasPermission(session, 'students', 'read')
		);
	}

	async getRegistrationData(stdNo: number) {
		return withPermission(
			async () => this.repository.findRegistrationData(stdNo),
			async (session) =>
				session?.user?.stdNo === stdNo ||
				hasAnyPermission(session, 'registration', ['read'])
		);
	}

	async getRegistrationDataByTerm(stdNo: number, termCode: string) {
		return withPermission(
			async () => this.repository.findRegistrationDataByTerm(stdNo, termCode),
			async (session) =>
				session?.user?.stdNo === stdNo ||
				hasAnyPermission(session, 'registration', ['read'])
		);
	}

	async getStdNoByUserId(userId: string) {
		return withPermission(
			async () => this.repository.findStdNoByUserId(userId),
			'auth'
		);
	}

	async findStudentByUserId(userId: string) {
		return withPermission(
			async () => {
				return await this.repository.findStudentByUserId(userId);
			},
			async (session) =>
				session?.user?.id === userId ||
				hasPermission(session, 'students', 'read')
		);
	}

	async findBySemesterModules(semesterModuleIds: number[]) {
		const term = await termsService.getActiveOrThrow();
		return withPermission(
			async () =>
				this.repository.findBySemesterModules(semesterModuleIds, term.code),
			{ students: ['read'] }
		);
	}

	async findAll(
		params: QueryOptions<typeof students> & { filter?: StudentFilter }
	) {
		return withPermission(async () => this.repository.queryBasic(params), {
			students: ['read'],
		});
	}

	async create(data: Student) {
		return withPermission(
			async (session) =>
				this.repository.create(data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'student_creation',
					stdNo: data.stdNo,
				}),
			{ students: ['update'] }
		);
	}

	async update(stdNo: number, data: Student) {
		return withPermission(
			async (session) =>
				this.repository.update(stdNo, data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'student_update',
					stdNo,
				}),
			{ students: ['update'] }
		);
	}

	async updateUserId(stdNo: number, userId: string | null) {
		return withPermission(
			async (session) =>
				this.repository.updateUserId(stdNo, userId, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'student_update',
					stdNo,
				}),
			{ students: ['update'] }
		);
	}

	async saveZohoContactId(stdNo: number, zohoContactId: string) {
		return withPermission(
			async () => this.repository.saveZohoContactId(stdNo, zohoContactId),
			{ zoho: ['update'] }
		);
	}

	async createFull(data: {
		student: Omit<Student, 'stdNo'>;
		nextOfKins: Omit<typeof nextOfKins.$inferInsert, 'stdNo'>[];
		program: Omit<typeof studentPrograms.$inferInsert, 'stdNo'>;
	}) {
		return withPermission(
			async (session) =>
				this.repository.createFull(data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'student_creation',
				}),
			{ students: ['update'] }
		);
	}

	async updateProgramStructure(stdNo: number, structureId: number) {
		return withPermission(
			async (session) =>
				this.repository.updateProgramStructure(stdNo, structureId, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'student_program_structure_changed',
					stdNo,
				}),
			{ students: ['update'] }
		);
	}

	async getStudentPrograms(stdNo: number): Promise<Program[]> {
		return withPermission(
			async () => {
				const student = await this.repository.findStudentByStdNo(stdNo);
				return student?.programs || [];
			},
			async (session) =>
				session?.user?.stdNo === stdNo ||
				hasPermission(session, 'students', 'read')
		);
	}

	async getPhotoKey(stdNo: number) {
		return withPermission(
			async () => this.repository.findPhotoKey(stdNo),
			'all'
		);
	}

	async uploadPhoto(stdNo: number, photo: File) {
		return withPermission(
			async (session) => {
				const existingKey = await this.repository.findPhotoKey(stdNo);
				if (existingKey) {
					await deleteFile(existingKey);
				}

				const ext = photo.name.split('.').pop()?.toLowerCase() || 'jpg';
				const key = StoragePaths.studentPhoto(stdNo, ext);
				await uploadFile(photo, key);

				return this.repository.updatePhotoKey(stdNo, key, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'student_update',
					stdNo,
				});
			},
			{ students: ['update'] }
		);
	}

	async updateWithReasons(
		stdNo: number,
		data: Partial<Student>,
		reasons?: string,
		attachments?: AuditAttachmentInfo[]
	) {
		return withPermission(
			async (session) =>
				this.repository.updateStudentWithAudit(stdNo, data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'student_update',
					stdNo,
					metadata: buildAuditMetadata(reasons, attachments),
				}),
			{ students: ['update'] }
		);
	}

	async updateForStatusWorkflow(
		stdNo: number,
		status: NonNullable<Student['status']>,
		reasons?: string
	) {
		return withPermission(
			async (session) =>
				this.repository.updateStudentWithAudit(
					stdNo,
					{ status },
					{
						userId: requireSessionUserId(session),
						role: session!.user!.role!,
						activityType: 'student_update',
						stdNo,
						metadata: reasons ? { reasons } : undefined,
					}
				),
			{ students: ['update'] }
		);
	}

	async updateStudentProgram(
		id: number,
		data: Partial<typeof studentPrograms.$inferInsert>,
		stdNo: number,
		reasons?: string,
		attachments?: AuditAttachmentInfo[]
	) {
		return withPermission(
			async (session) =>
				this.repository.updateStudentProgram(id, data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: resolveStudentProgramActivityType(data.status),
					stdNo,
					metadata: buildAuditMetadata(reasons, attachments),
				}),
			{ students: ['update'] }
		);
	}

	async createStudentProgram(
		data: typeof studentPrograms.$inferInsert,
		reasons?: string
	) {
		return withPermission(
			async (session) =>
				this.repository.createStudentProgram(data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'program_enrollment',
					stdNo: data.stdNo,
					metadata: reasons ? { reasons } : undefined,
				}),
			{ students: ['update'] }
		);
	}

	async updateStudentSemester(
		id: number,
		data: Partial<typeof studentSemesters.$inferInsert>,
		stdNo: number,
		reasons?: string,
		attachments?: AuditAttachmentInfo[]
	) {
		return withPermission(
			async (session) =>
				this.repository.updateStudentSemester(id, data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: resolveStudentSemesterActivityType(data.status),
					stdNo,
					metadata: buildAuditMetadata(reasons, attachments),
				}),
			{ students: ['update'] }
		);
	}

	async updateStudentSemesterForStatusWorkflow(
		id: number,
		status: NonNullable<(typeof studentSemesters.$inferInsert)['status']>,
		stdNo: number,
		reasons?: string
	) {
		return withPermission(
			async (session) =>
				this.repository.updateStudentSemester(
					id,
					{ status },
					{
						userId: requireSessionUserId(session),
						role: session!.user!.role!,
						activityType: resolveStudentSemesterActivityType(status),
						stdNo,
						metadata: reasons ? { reasons } : undefined,
					}
				),
			{ students: ['update'] }
		);
	}

	async updateStudentModule(
		id: number,
		data: Partial<typeof studentModules.$inferInsert>,
		stdNo: number,
		reasons?: string,
		attachments?: AuditAttachmentInfo[]
	) {
		return withPermission(
			async (session) =>
				this.repository.updateStudentModule(id, data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: resolveStudentModuleActivityType(data.status),
					stdNo,
					metadata: buildAuditMetadata(reasons, attachments),
				}),
			{ students: ['update'] }
		);
	}

	async searchSemesterModulesForReassign(search: string) {
		return withPermission(
			async () => this.repository.searchSemesterModulesForReassign(search),
			async (session) =>
				session?.user?.role === 'admin' ||
				session?.user?.presetName === 'Registry Manager'
		);
	}

	async reassignStudentModule(
		studentModuleId: number,
		newSemesterModuleId: number,
		stdNo: number,
		reasons?: string,
		attachments?: AuditAttachmentInfo[]
	) {
		return withPermission(
			async (session) =>
				this.repository.updateStudentModule(
					studentModuleId,
					{ semesterModuleId: newSemesterModuleId },
					{
						userId: requireSessionUserId(session),
						role: session!.user!.role!,
						activityType: 'module_reassigned',
						stdNo,
						metadata: buildAuditMetadata(reasons, attachments),
					}
				),
			async (session) =>
				session?.user?.role === 'admin' ||
				session?.user?.presetName === 'Registry Manager'
		);
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
