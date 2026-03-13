import { hasSessionPermission } from '@/core/auth/sessionPermissions';
import type { academicRecords, StandardGrade } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import { mapGradesToStandard } from '../_lib/grade-mapping';
import type { SubjectGradeInput } from '../_lib/types';
import AcademicRecordRepository from './repository';

class AcademicRecordService extends BaseService<typeof academicRecords, 'id'> {
	private repo: AcademicRecordRepository;

	constructor() {
		const repo = new AcademicRecordRepository();
		super(repo, {
			byIdAuth: { applicants: ['read'] },
			findAllAuth: { applicants: ['read'] },
			createAuth: { applicants: ['create'] },
			updateAuth: { applicants: ['update'] },
			deleteAuth: { applicants: ['delete'] },
			activityTypes: {
				create: 'academic_record_created',
				update: 'academic_record_updated',
				delete: 'academic_record_deleted',
			},
		});
		this.repo = repo;
	}

	override async get(id: string) {
		return withPermission(
			async () => this.repo.findById(id),
			async (session) =>
				hasSessionPermission(session, 'applicants', 'read', [
					'applicant',
					'user',
				])
		);
	}

	async findByApplicant(applicantId: string, page = 1) {
		return withPermission(
			async () => this.repo.findByApplicant(applicantId, page),
			async (session) =>
				hasSessionPermission(session, 'applicants', 'read', [
					'applicant',
					'user',
				])
		);
	}

	async createWithGrades(
		data: typeof academicRecords.$inferInsert,
		isLevel4: boolean,
		grades?: SubjectGradeInput[]
	) {
		return withPermission(
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
			async (session) =>
				hasSessionPermission(session, 'applicants', 'create', [
					'applicant',
					'user',
				])
		);
	}

	async updateWithGrades(
		id: string,
		data: Partial<typeof academicRecords.$inferInsert>,
		isLevel4: boolean,
		grades?: SubjectGradeInput[]
	) {
		return withPermission(
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
			async (session) => hasSessionPermission(session, 'applicants', 'update')
		);
	}

	override async delete(id: string) {
		return withPermission(
			async (session) =>
				this.repo.removeById(id, this.buildAuditOptions(session, 'delete')),
			async (session) =>
				hasSessionPermission(session, 'applicants', 'delete', [
					'applicant',
					'user',
				])
		);
	}

	async findByCertificateNumber(certificateNumber: string) {
		return withPermission(
			async () => this.repo.findByCertificateNumber(certificateNumber),
			async (session) =>
				hasSessionPermission(session, 'applicants', 'read', [
					'applicant',
					'user',
				])
		);
	}

	async findByApplicantDocumentId(applicantDocumentId: string) {
		return withPermission(
			async () => this.repo.findByApplicantDocumentId(applicantDocumentId),
			async (session) =>
				hasSessionPermission(session, 'applicants', 'read', [
					'applicant',
					'user',
				])
		);
	}

	async linkDocument(academicRecordId: string, applicantDocumentId: string) {
		return withPermission(
			async () => this.repo.linkDocument(academicRecordId, applicantDocumentId),
			async (session) =>
				hasSessionPermission(session, 'applicants', 'update', [
					'applicant',
					'user',
				])
		);
	}
}

export const academicRecordsService = serviceWrapper(
	AcademicRecordService,
	'AcademicRecordService'
);
