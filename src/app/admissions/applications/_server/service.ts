import { eq } from 'drizzle-orm';
import {
	type ApplicationStatus,
	type applications,
	db,
	intakePeriods,
} from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
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
					return this.repo.update(existing.id, {
						...data,
						updatedAt: new Date(),
					});
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

	async recordPayment(applicationId: string, receiptId: string) {
		return withAuth(async () => {
			await this.repo.linkReceipt(applicationId, receiptId);
			return this.repo.updatePaymentStatus(applicationId, 'paid');
		}, ['registry', 'marketing', 'admin']);
	}

	async getPaymentInfo(applicationId: string) {
		return withAuth(async () => {
			const application = await this.repo.findById(applicationId);
			if (!application) {
				throw new Error('Application not found');
			}
			const receipts = await this.repo.getLinkedReceipts(applicationId);
			return {
				feeAmount: application.intakePeriod.applicationFee,
				paymentStatus: application.paymentStatus,
				receipts,
			};
		}, ['registry', 'marketing', 'admin']);
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
}

export const applicationsService = serviceWrapper(
	ApplicationService,
	'ApplicationService'
);
