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
			byIdRoles: ['registry', 'marketing', 'admin'],
			findAllRoles: ['registry', 'marketing', 'admin'],
			createRoles: ['registry', 'marketing', 'admin'],
			updateRoles: ['registry', 'marketing', 'admin'],
			deleteRoles: ['registry', 'marketing', 'admin'],
		});
		this.repo = repo;
	}

	override async get(id: string) {
		return withAuth(
			async () => this.repo.findById(id),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async findByApplicant(applicantId: string, page = 1) {
		return withAuth(
			async () => this.repo.findByApplicant(applicantId, page),
			['registry', 'marketing', 'admin', 'applicant']
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
						subjectId: string;
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
		}, ['registry', 'marketing', 'admin', 'applicant']);
	}

	async updateWithGrades(
		id: string,
		data: Partial<typeof academicRecords.$inferInsert>,
		isLevel4: boolean,
		grades?: SubjectGradeInput[]
	) {
		return withAuth(async () => {
			let mappedGrades:
				| {
						subjectId: string;
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
		}, ['registry', 'marketing', 'admin']);
	}

	override async delete(id: string) {
		return withAuth(
			async () => this.repo.removeById(id),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async findByCertificateNumber(certificateNumber: string) {
		return withAuth(
			async () => this.repo.findByCertificateNumber(certificateNumber),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async linkDocument(academicRecordId: string, applicantDocumentId: string) {
		return withAuth(
			async () => this.repo.linkDocument(academicRecordId, applicantDocumentId),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}
}

export const academicRecordsService = serviceWrapper(
	AcademicRecordService,
	'AcademicRecordService'
);
