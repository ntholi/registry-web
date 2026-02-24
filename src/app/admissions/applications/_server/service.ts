import type {
	ClassificationRules,
	SubjectGradeRules,
} from '@admissions/entry-requirements/_lib/types';
import { eq } from 'drizzle-orm';
import {
	type ApplicationStatus,
	academicRecords,
	applications,
	db,
	intakePeriods,
} from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import { calculateAllScores } from '../_lib/scoring';
import type { ApplicationFilters } from '../_lib/types';
import ApplicationRepository from './repository';

class ApplicationService extends BaseService<typeof applications, 'id'> {
	private repo: ApplicationRepository;

	constructor() {
		const repo = new ApplicationRepository();
		super(repo, {
			byIdRoles: ['registry', 'marketing', 'admin'],
			findAllRoles: ['registry', 'marketing', 'admin'],
			createRoles: ['registry', 'marketing', 'admin'],
			updateRoles: ['registry', 'marketing', 'admin'],
			deleteRoles: ['admin'],
			activityTypes: {
				create: 'application_submitted',
				update: 'application_updated',
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

	async search(page: number, search: string, filters?: ApplicationFilters) {
		return withAuth(
			async () => this.repo.search(page, search, filters),
			['registry', 'marketing', 'admin']
		);
	}

	override async create(data: typeof applications.$inferInsert) {
		return withAuth(
			async (session) => {
				const exists = await this.repo.existsForIntake(
					data.applicantId,
					data.intakePeriodId
				);
				if (exists) {
					throw new Error(
						'DUPLICATE_APPLICATION: Application already exists for this intake'
					);
				}

				const intake = await db.query.intakePeriods.findFirst({
					where: eq(intakePeriods.id, data.intakePeriodId),
				});

				if (!intake) {
					throw new Error('Intake period not found');
				}

				const today = new Date().toISOString().split('T')[0];
				const isActive = intake.startDate <= today && intake.endDate >= today;

				if (!isActive) {
					throw new Error(
						'INACTIVE_INTAKE_PERIOD: Cannot create application for inactive intake'
					);
				}

				const application = await this.repo.create({
					...data,
					status: 'submitted',
					paymentStatus: 'unpaid',
					createdBy: session?.user?.id,
					applicationDate: new Date(),
				});

				await this.repo.addStatusHistory({
					applicationId: application.id,
					fromStatus: null,
					toStatus: 'submitted',
					changedBy: session?.user?.id,
					notes: 'Application submitted',
				});

				this.computeAndUpsertScores({
					id: application.id,
					applicantId: data.applicantId,
					firstChoiceProgramId: data.firstChoiceProgramId ?? null,
					secondChoiceProgramId: data.secondChoiceProgramId ?? null,
				}).catch(() => {});

				return application;
			},
			['registry', 'marketing', 'admin']
		);
	}

	async createOrUpdate(data: typeof applications.$inferInsert) {
		return withAuth(
			async (session) => {
				const existing = await this.repo.findByApplicantAndIntake(
					data.applicantId,
					data.intakePeriodId
				);

				if (existing) {
					const updated = await this.repo.update(existing.id, {
						...data,
						updatedAt: new Date(),
					});

					this.computeAndUpsertScores({
						id: existing.id,
						applicantId: data.applicantId,
						firstChoiceProgramId: data.firstChoiceProgramId ?? null,
						secondChoiceProgramId: data.secondChoiceProgramId ?? null,
					}).catch(() => {});

					return updated;
				}

				const intake = await db.query.intakePeriods.findFirst({
					where: eq(intakePeriods.id, data.intakePeriodId),
				});

				if (!intake) {
					throw new Error('Intake period not found');
				}

				const today = new Date().toISOString().split('T')[0];
				const isActive = intake.startDate <= today && intake.endDate >= today;

				if (!isActive) {
					throw new Error(
						'INACTIVE_INTAKE_PERIOD: Cannot create application for inactive intake'
					);
				}

				const application = await this.repo.create({
					...data,
					status: data.status ?? 'draft',
					paymentStatus: 'unpaid',
					createdBy: session?.user?.id,
					applicationDate: new Date(),
				});

				this.computeAndUpsertScores({
					id: application.id,
					applicantId: data.applicantId,
					firstChoiceProgramId: data.firstChoiceProgramId ?? null,
					secondChoiceProgramId: data.secondChoiceProgramId ?? null,
				}).catch(() => {});

				return application;
			},
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async changeStatus(
		applicationId: string,
		newStatus: ApplicationStatus,
		notes?: string,
		rejectionReason?: string
	) {
		return withAuth(
			async (session) => {
				const application = await this.repo.findById(applicationId);
				if (!application) {
					throw new Error('Application not found');
				}

				if (newStatus === 'rejected' && !rejectionReason) {
					throw new Error('Rejection reason is required when rejecting');
				}

				const fromStatus = application.status;

				await this.repo.addStatusHistory({
					applicationId,
					fromStatus,
					toStatus: newStatus,
					changedBy: session?.user?.id,
					notes,
					rejectionReason:
						newStatus === 'rejected' ? rejectionReason : undefined,
				});

				return this.repo.updateStatus(applicationId, newStatus);
			},
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async addNote(applicationId: string, content: string) {
		return withAuth(
			async (session) => {
				return this.repo.addNote({
					applicationId,
					content,
					createdBy: session?.user?.id,
				});
			},
			['registry', 'marketing', 'admin']
		);
	}

	async getNotes(applicationId: string) {
		return withAuth(
			async () => this.repo.getNotes(applicationId),
			['registry', 'marketing', 'admin']
		);
	}

	async findByApplicant(applicantId: string) {
		return withAuth(
			async () => this.repo.findByApplicant(applicantId),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async countByStatus(status: ApplicationStatus) {
		return withAuth(
			async () => this.repo.countByStatus(status),
			['registry', 'marketing', 'admin']
		);
	}

	async countPending() {
		return withAuth(
			async () => this.repo.countPending(),
			['registry', 'marketing', 'admin']
		);
	}

	async getForPayment(applicationId: string) {
		return withAuth(
			async () => this.repo.findForPayment(applicationId),
			['all']
		);
	}

	async recalculateScores(applicationId: string) {
		return withAuth(async () => {
			const application = await db.query.applications.findFirst({
				where: eq(applications.id, applicationId),
				columns: {
					id: true,
					applicantId: true,
					firstChoiceProgramId: true,
					secondChoiceProgramId: true,
				},
			});
			if (!application) throw new Error('Application not found');

			return this.computeAndUpsertScores(application);
		}, ['registry', 'marketing', 'admin']);
	}

	async recalculateScoresForApplicant(applicantId: string) {
		return withAuth(async () => {
			const apps = await this.repo.findApplicationIdsByApplicant(applicantId);
			const results = [];
			for (const app of apps) {
				const result = await this.computeAndUpsertScores(app);
				results.push(result);
			}
			return results;
		}, ['registry', 'marketing', 'admin', 'applicant']);
	}

	private async computeAndUpsertScores(application: {
		id: string;
		applicantId: string;
		firstChoiceProgramId: number | null;
		secondChoiceProgramId: number | null;
	}) {
		const [records, requirements, schools] = await Promise.all([
			db.query.academicRecords.findMany({
				where: eq(academicRecords.applicantId, application.applicantId),
				with: {
					certificateType: {
						columns: { id: true, name: true, lqfLevel: true },
					},
					subjectGrades: {
						with: { subject: { columns: { id: true, name: true } } },
					},
				},
			}),
			db.query.entryRequirements.findMany({
				with: {
					certificateType: {
						columns: { id: true, name: true, lqfLevel: true },
					},
				},
			}),
			db.query.recognizedSchools.findMany({
				columns: { name: true },
			}),
		]);

		const typedRequirements = requirements.map((er) => ({
			programId: er.programId,
			certificateType: er.certificateType,
			rules: er.rules as SubjectGradeRules | ClassificationRules,
		}));

		const scores = calculateAllScores(
			records,
			application.firstChoiceProgramId,
			application.secondChoiceProgramId,
			typedRequirements,
			schools
		);

		return this.repo.upsertScores(application.id, scores);
	}
}

export const applicationsService = serviceWrapper(
	ApplicationService,
	'ApplicationService'
);
