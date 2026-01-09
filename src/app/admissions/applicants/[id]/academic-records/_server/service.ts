import type { academicRecords, StandardGrade } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import { mapGradesToStandard } from '../_lib/grade-mapping';
import type { SubjectGradeInput } from '../_lib/types';
import AcademicRecordRepository from './repository';

class AcademicRecordService extends BaseService<typeof academicRecords, 'id'> {
	private repo: AcademicRecordRepository;

	constructor() {
		const repo = new AcademicRecordRepository();
		super(repo, {
			byIdRoles: ['registry', 'admin'],
			findAllRoles: ['registry', 'admin'],
			createRoles: ['registry', 'admin'],
			updateRoles: ['registry', 'admin'],
			deleteRoles: ['registry', 'admin'],
		});
		this.repo = repo;
	}

	override async get(id: number) {
		return withAuth(async () => this.repo.findById(id), ['registry', 'admin']);
	}

	async findByApplicant(applicantId: string, page = 1) {
		return withAuth(
			async () => this.repo.findByApplicant(applicantId, page),
			['registry', 'admin']
		);
	}

	async createWithGrades(
		data: typeof academicRecords.$inferInsert,
		isLevel4: boolean,
		grades?: SubjectGradeInput[]
	) {
		return withAuth(async () => {
			let mappedGrades:
				| {
						subjectId: number;
						originalGrade: string;
						standardGrade: StandardGrade;
				  }[]
				| undefined;

			if (isLevel4 && grades && grades.length > 0) {
				mappedGrades = await mapGradesToStandard(
					grades,
					data.certificateTypeId
				);
			}

			return this.repo.createWithGrades(data, mappedGrades);
		}, ['registry', 'admin']);
	}

	async updateWithGrades(
		id: number,
		data: Partial<typeof academicRecords.$inferInsert>,
		isLevel4: boolean,
		grades?: SubjectGradeInput[]
	) {
		return withAuth(async () => {
			let mappedGrades:
				| {
						subjectId: number;
						originalGrade: string;
						standardGrade: StandardGrade;
				  }[]
				| undefined;

			if (isLevel4 && grades !== undefined && data.certificateTypeId) {
				mappedGrades =
					grades.length > 0
						? await mapGradesToStandard(grades, data.certificateTypeId)
						: [];
			}

			return this.repo.updateWithGrades(id, data, mappedGrades);
		}, ['registry', 'admin']);
	}

	override async delete(id: number) {
		return withAuth(
			async () => this.repo.removeById(id),
			['registry', 'admin']
		);
	}
}

export const academicRecordsService = serviceWrapper(
	AcademicRecordService,
	'AcademicRecordService'
);
