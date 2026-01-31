import { mapGrade } from '@admissions/certificate-types/_server/actions';
import { entryRequirementsService } from '@admissions/entry-requirements/_server/service';
import { intakePeriodsService } from '@admissions/intake-periods/_server/service';
import type { applicants, documents, guardians } from '@/core/database';
import type { DocumentAnalysisResult } from '@/core/integrations/ai/documents';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import { getEligiblePrograms } from '../_lib/eligibility';
import {
	findCertificateTypeByName,
	type PendingDocument,
	resolveSubjectId,
} from './document-actions';
import ApplicantRepository from './repository';

type DocumentInput = {
	fileName: string;
	fileUrl: string;
	type: (typeof documents.$inferInsert)['type'];
	analysisResult: DocumentAnalysisResult;
};

type AcademicRecordInput = Parameters<
	ApplicantRepository['createWithDocumentsAndRecords']
>[2][number];

class ApplicantService extends BaseService<typeof applicants, 'id'> {
	private repo: ApplicantRepository;

	constructor() {
		const repo = new ApplicantRepository();
		super(repo, {
			byIdRoles: ['registry', 'marketing', 'admin'],
			findAllRoles: ['registry', 'marketing', 'admin'],
			createRoles: ['registry', 'marketing', 'admin'],
			updateRoles: ['registry', 'marketing', 'admin'],
		});
		this.repo = repo;
	}

	override async get(id: string) {
		return withAuth(
			async () => this.repo.findById(id),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async findByUserId(userId: string) {
		return this.repo.findByUserId(userId);
	}

	async search(page: number, search: string) {
		return withAuth(
			async () => this.repo.search(page, search),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	override async create(data: typeof applicants.$inferInsert) {
		return withAuth(async () => {
			if (data.nationalId) {
				const existing = await this.repo.findByNationalId(data.nationalId);
				if (existing) {
					throw new Error('DUPLICATE_NATIONAL_ID: National ID already exists');
				}
			}
			return this.repo.create(data);
		}, ['registry', 'marketing', 'admin', 'applicant']);
	}

	override async update(
		id: string,
		data: Partial<typeof applicants.$inferInsert>
	) {
		return withAuth(async () => {
			// if (data.nationalId) {
			// 	const existing = await this.repo.findByNationalId(data.nationalId);
			// 	if (existing && existing.id !== id) {
			// 		throw new Error('DUPLICATE_NATIONAL_ID: National ID already exists');
			// 	}
			// }
			return this.repo.update(id, data);
		}, ['registry', 'marketing', 'admin', 'applicant']);
	}

	async addPhone(applicantId: string, phoneNumber: string) {
		return withAuth(
			async () => this.repo.addPhone(applicantId, phoneNumber),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async removePhone(phoneId: string) {
		return withAuth(
			async () => this.repo.removePhone(phoneId),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async createGuardian(
		data: typeof guardians.$inferInsert,
		phoneNumbers?: string[]
	) {
		return withAuth(
			async () => this.repo.createGuardian(data, phoneNumbers),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async updateGuardian(
		id: string,
		data: Partial<typeof guardians.$inferInsert>,
		phoneNumbers?: string[]
	) {
		return withAuth(
			async () => this.repo.updateGuardian(id, data, phoneNumbers),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async deleteGuardian(id: string) {
		return withAuth(
			async () => this.repo.deleteGuardian(id),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async addGuardianPhone(guardianId: string, phoneNumber: string) {
		return withAuth(
			async () => this.repo.addGuardianPhone(guardianId, phoneNumber),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async removeGuardianPhone(phoneId: string) {
		return withAuth(
			async () => this.repo.removeGuardianPhone(phoneId),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async createWithDocumentsAndRecords(
		applicantData: typeof applicants.$inferInsert,
		pendingDocs: PendingDocument[],
		academicDocs: PendingDocument[]
	) {
		return withAuth(async () => {
			if (applicantData.nationalId) {
				const existing = await this.repo.findByNationalId(
					applicantData.nationalId
				);
				if (existing) {
					throw new Error('An applicant with this National ID already exists');
				}
			}

			const docInputs: DocumentInput[] = pendingDocs.map((doc) => {
				const type = doc.analysisResult.documentType;
				return {
					fileName: doc.fileName,
					fileUrl: `https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev/documents/admissions/${doc.fileName}`,
					type,
					analysisResult: doc.analysisResult,
				};
			});

			const recordInputs: AcademicRecordInput[] = [];
			for (const doc of academicDocs) {
				const result = doc.analysisResult;
				if (result.category !== 'academic') continue;
				if (!result.examYear || !result.institutionName) continue;

				const certType = result.certificateType
					? await findCertificateTypeByName(result.certificateType)
					: null;

				if (!certType) continue;

				const grades: AcademicRecordInput['subjectGrades'] = [];
				if (result.subjects && result.subjects.length > 0) {
					for (const sub of result.subjects) {
						const subjectId = await resolveSubjectId(sub.name);
						const mapped = await mapGrade(certType.id, sub.grade);
						if (mapped) {
							grades.push({
								subjectId,
								originalGrade: sub.grade,
								standardGrade: mapped,
							});
						}
					}
				}

				recordInputs.push({
					certificateTypeId: certType.id,
					examYear: result.examYear,
					institutionName: result.institutionName,
					certificateNumber: result.certificateNumber,
					candidateNumber: result.candidateNumber,
					resultClassification: result.overallClassification,
					subjectGrades: grades.length > 0 ? grades : undefined,
					sourceFileName: doc.fileName,
				});
			}

			return this.repo.createWithDocumentsAndRecords(
				applicantData,
				docInputs,
				recordInputs
			);
		}, ['registry', 'marketing', 'admin']);
	}

	async getOrCreateForCurrentUser() {
		return withAuth(
			async (session) => {
				const userId = session?.user?.id;
				if (!userId) {
					throw new Error('INVALID_SESSION: User ID is missing');
				}

				const fullName = session?.user?.name ?? 'New Applicant';
				const [applicant, activeIntake] = await Promise.all([
					this.repo.findOrCreateByUserId(userId, fullName),
					intakePeriodsService.findActive(),
				]);

				if (!applicant) return null;

				return { ...applicant, activeIntake };
			},
			['auth']
		);
	}

	async findEligiblePrograms(applicantId: string) {
		return withAuth(async () => {
			const applicant = await this.repo.findById(applicantId);
			if (!applicant) return [];
			const requirements =
				await entryRequirementsService.findAllForEligibility();
			return getEligiblePrograms(applicant.academicRecords, requirements);
		}, ['registry', 'marketing', 'admin', 'applicant']);
	}

	async updateUserId(applicantId: string, userId: string | null) {
		return withAuth(
			async () => this.repo.update(applicantId, { userId }),
			['registry', 'marketing', 'admin']
		);
	}
}

export const applicantsService = serviceWrapper(
	ApplicantService,
	'ApplicantService'
);
