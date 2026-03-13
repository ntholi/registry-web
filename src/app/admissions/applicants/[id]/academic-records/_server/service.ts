import type { academicRecords, StandardGrade } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withPermission';
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
			activityTypes: {
				create: 'academic_record_created',
				update: 'academic_record_updated',
				delete: 'academic_record_deleted',
			},
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
		return withAuth(
			async (session) => {
				let preparedGrades:
					| {
							subjectId: string;
							originalGrade: string;
							standardGrade: StandardGrade | null;
					  }[]
					| undefined;

				if (grades && grades.length > 0) {
					if (isLevel4) {
						preparedGrades = await mapGradesToStandard(
							grades,
							data.certificateTypeId
						);
					} else {
						preparedGrades = grades.map((g) => ({
							subjectId: g.subjectId,
							originalGrade: g.originalGrade,
							standardGrade: null,
						}));
					}
				}

				return this.repo.createWithGrades(
					data,
					preparedGrades,
					this.buildAuditOptions(session, 'create')
				);
			},
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async updateWithGrades(
		id: string,
		data: Partial<typeof academicRecords.$inferInsert>,
		isLevel4: boolean,
		grades?: SubjectGradeInput[]
	) {
		return withAuth(
			async (session) => {
				let preparedGrades:
					| {
							subjectId: string;
							originalGrade: string;
							standardGrade: StandardGrade | null;
					  }[]
					| undefined;

				if (grades !== undefined && data.certificateTypeId) {
					if (isLevel4) {
						preparedGrades =
							grades.length > 0
								? await mapGradesToStandard(grades, data.certificateTypeId)
								: [];
					} else {
						preparedGrades = grades.map((g) => ({
							subjectId: g.subjectId,
							originalGrade: g.originalGrade,
							standardGrade: null,
						}));
					}
				}

				return this.repo.updateWithGrades(
					id,
					data,
					preparedGrades,
					this.buildAuditOptions(session, 'update')
				);
			},
			['registry', 'marketing', 'admin']
		);
	}

	override async delete(id: string) {
		return withAuth(
			async (session) =>
				this.repo.removeById(id, this.buildAuditOptions(session, 'delete')),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async findByCertificateNumber(certificateNumber: string) {
		return withAuth(
			async () => this.repo.findByCertificateNumber(certificateNumber),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async findByApplicantDocumentId(applicantDocumentId: string) {
		return withAuth(
			async () => this.repo.findByApplicantDocumentId(applicantDocumentId),
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
