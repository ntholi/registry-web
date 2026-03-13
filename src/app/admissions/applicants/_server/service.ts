import { mapGrade } from '@admissions/certificate-types/_server/actions';
import { entryRequirementsService } from '@admissions/entry-requirements/_server/service';
import { intakePeriodsService } from '@admissions/intake-periods/_server/service';
import { recognizedSchoolsService } from '@admissions/recognized-schools/_server/service';
import type { Session } from '@/core/auth';
import { hasPermission } from '@/core/auth/permissions';
import type {
	applicantLocations,
	applicants,
	documents,
	guardians,
} from '@/core/database';
import type { DocumentAnalysisResult } from '@/core/integrations/ai/documents';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import { normalizeResultClassification } from '@/shared/lib/utils/resultClassification';
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

function canManageApplicants(
	session: Session | null | undefined,
	action: 'read' | 'create' | 'update'
) {
	return hasPermission(session, 'applicants', action);
}

function isApplicantSession(session: Session | null | undefined) {
	return session?.user?.role === 'applicant' || session?.user?.role === 'user';
}

async function canAccessApplicantSelfService(
	session: Session | null | undefined,
	action: 'read' | 'create' | 'update'
) {
	return canManageApplicants(session, action) || isApplicantSession(session);
}

class ApplicantService extends BaseService<typeof applicants, 'id'> {
	private repo: ApplicantRepository;

	constructor() {
		const repo = new ApplicantRepository();
		super(repo, {
			byIdAuth: { applicants: ['read'] },
			findAllAuth: { applicants: ['read'] },
			createAuth: { applicants: ['create'] },
			updateAuth: { applicants: ['update'] },
			activityTypes: {
				create: 'applicant_created',
				update: 'applicant_updated',
			},
		});
		this.repo = repo;
	}

	override async get(id: string) {
		return withPermission(
			async () => this.repo.findById(id),
			async (session) => canAccessApplicantSelfService(session, 'read')
		);
	}

	async findByUserId(userId: string) {
		return this.repo.findByUserId(userId);
	}

	async findByNationalIdWithUser(nationalId: string) {
		return this.repo.findByNationalIdWithUser(nationalId);
	}

	async search(page: number, search: string) {
		return withPermission(async () => this.repo.search(page, search), {
			applicants: ['read'],
		});
	}

	override async create(data: typeof applicants.$inferInsert) {
		return withPermission(
			async (session) => {
				if (data.nationalId) {
					const existing = await this.repo.findByNationalId(data.nationalId);
					if (existing) {
						throw new Error(
							'DUPLICATE_NATIONAL_ID: National ID already exists'
						);
					}
				}
				return this.repo.create(
					data,
					this.buildAuditOptions(session, 'create')
				);
			},
			async (session) => canAccessApplicantSelfService(session, 'create')
		);
	}

	override async update(
		id: string,
		data: Partial<typeof applicants.$inferInsert>
	) {
		return withPermission(
			async (session) => {
				return this.repo.update(
					id,
					data,
					this.buildAuditOptions(session, 'update')
				);
			},
			async (session) => canAccessApplicantSelfService(session, 'update')
		);
	}

	async addPhone(applicantId: string, phoneNumber: string) {
		return withPermission(
			async () => this.repo.addPhone(applicantId, phoneNumber),
			async (session) => canAccessApplicantSelfService(session, 'update')
		);
	}

	async removePhone(phoneId: string) {
		return withPermission(
			async () => this.repo.removePhone(phoneId),
			async (session) => canAccessApplicantSelfService(session, 'update')
		);
	}

	async createGuardian(
		data: typeof guardians.$inferInsert,
		phoneNumbers?: string[]
	) {
		return withPermission(
			async () => this.repo.createGuardian(data, phoneNumbers),
			async (session) => canAccessApplicantSelfService(session, 'update')
		);
	}

	async updateGuardian(
		id: string,
		data: Partial<typeof guardians.$inferInsert>,
		phoneNumbers?: string[]
	) {
		return withPermission(
			async () => this.repo.updateGuardian(id, data, phoneNumbers),
			async (session) => canAccessApplicantSelfService(session, 'update')
		);
	}

	async deleteGuardian(id: string) {
		return withPermission(
			async () => this.repo.deleteGuardian(id),
			async (session) => canAccessApplicantSelfService(session, 'update')
		);
	}

	async addGuardianPhone(guardianId: string, phoneNumber: string) {
		return withPermission(
			async () => this.repo.addGuardianPhone(guardianId, phoneNumber),
			async (session) => canAccessApplicantSelfService(session, 'update')
		);
	}

	async removeGuardianPhone(phoneId: string) {
		return withPermission(
			async () => this.repo.removeGuardianPhone(phoneId),
			async (session) => canAccessApplicantSelfService(session, 'update')
		);
	}

	async createWithDocumentsAndRecords(
		applicantData: typeof applicants.$inferInsert,
		pendingDocs: PendingDocument[],
		academicDocs: PendingDocument[]
	) {
		return withPermission(
			async () => {
				if (applicantData.nationalId) {
					const existing = await this.repo.findByNationalId(
						applicantData.nationalId
					);
					if (existing) {
						throw new Error(
							'An applicant with this National ID already exists'
						);
					}
				}

				const docInputs: DocumentInput[] = pendingDocs.map((doc) => {
					const type = doc.analysisResult.documentType;
					return {
						fileName: doc.originalName,
						fileUrl: doc.fileUrl,
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

					const isLevel4 = certType.lqfLevel === 4;
					const grades: AcademicRecordInput['subjectGrades'] = [];

					if (result.subjects && result.subjects.length > 0) {
						for (const sub of result.subjects) {
							const subjectId = await resolveSubjectId(sub.name);
							if (isLevel4) {
								const mapped = await mapGrade(certType.id, sub.grade);
								if (mapped) {
									grades.push({
										subjectId,
										originalGrade: sub.grade,
										standardGrade: mapped,
									});
								}
							} else {
								grades.push({
									subjectId,
									originalGrade: sub.grade,
									standardGrade: null,
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
						resultClassification: normalizeResultClassification(
							result.overallClassification
						),
						subjectGrades: grades.length > 0 ? grades : undefined,
						sourceFileName: doc.fileUrl,
					});
				}

				return this.repo.createWithDocumentsAndRecords(
					applicantData,
					docInputs,
					recordInputs
				);
			},
			async (session) => canAccessApplicantSelfService(session, 'create')
		);
	}

	async getOrCreateForCurrentUser() {
		return withPermission(async (session) => {
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
		}, 'auth');
	}

	async findEligiblePrograms(applicantId: string) {
		return withPermission(
			async () => {
				const applicant = await this.repo.findById(applicantId);
				if (!applicant) return [];
				const [requirements, recognizedSchools] = await Promise.all([
					entryRequirementsService.findAllForEligibility(),
					recognizedSchoolsService.findAllForEligibility(),
				]);
				return getEligiblePrograms(
					applicant.academicRecords,
					requirements,
					recognizedSchools
				);
			},
			async (session) => canAccessApplicantSelfService(session, 'read')
		);
	}

	async updateUserId(applicantId: string, userId: string | null) {
		return withPermission(
			async () => this.repo.update(applicantId, { userId }),
			{ applicants: ['update'] }
		);
	}

	async saveLocation(data: typeof applicantLocations.$inferInsert) {
		return withPermission(
			async () => this.repo.saveLocation(data),
			async (session) => canAccessApplicantSelfService(session, 'update')
		);
	}

	async findLocationByApplicantId(applicantId: string) {
		return withPermission(
			async () => this.repo.findLocationByApplicantId(applicantId),
			{ applicants: ['read'] }
		);
	}
}

export const applicantsService = serviceWrapper(
	ApplicantService,
	'ApplicantService'
);
