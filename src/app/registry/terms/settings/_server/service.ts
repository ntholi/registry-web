import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import { registrationDatesSchema } from '../_lib/registration-dates';
import TermSettingsRepository from './repository';

class TermSettingsService {
	private repository = new TermSettingsRepository();

	async findByTermId(termId: number) {
		return withAuth(async () => this.repository.findByTermId(termId), ['all']);
	}

	async updateResultsPublished(termId: number, published: boolean) {
		return withAuth(
			async (session) => {
				if (
					session?.user?.role !== 'admin' &&
					!(
						session?.user?.role === 'registry' &&
						session?.user?.position === 'manager'
					)
				) {
					throw new Error('Unauthorized');
				}
				return this.repository.updateResultsPublished(
					termId,
					published,
					session.user.id!
				);
			},
			['admin', 'registry']
		);
	}

	async updateGradebookAccess(termId: number, access: boolean) {
		return withAuth(
			async (session) => {
				if (
					session?.user?.role !== 'admin' &&
					!(
						session?.user?.role === 'registry' &&
						session?.user?.position === 'manager'
					)
				) {
					throw new Error('Unauthorized');
				}
				return this.repository.updateGradebookAccess(
					termId,
					access,
					session.user.id!
				);
			},
			['admin', 'registry']
		);
	}

	async updateRegistrationDates(
		termId: number,
		startDate: string | null,
		endDate: string | null
	) {
		const parsedResult = registrationDatesSchema.safeParse({
			startDate,
			endDate,
		});
		if (!parsedResult.success) {
			throw new Error(
				parsedResult.error.issues[0]?.message || 'Invalid registration dates'
			);
		}

		return withAuth(
			async (session) => {
				if (
					session?.user?.role !== 'admin' &&
					!(
						session?.user?.role === 'registry' &&
						session?.user?.position === 'manager'
					)
				) {
					throw new Error('Unauthorized');
				}
				return this.repository.updateRegistrationDates(
					termId,
					parsedResult.data.startDate,
					parsedResult.data.endDate,
					session.user.id!
				);
			},
			['admin', 'registry']
		);
	}

	async moveRejectedToBlocked(termId: number) {
		return withAuth(
			async (session) => {
				if (
					session?.user?.role !== 'admin' &&
					!(
						session?.user?.role === 'registry' &&
						session?.user?.position === 'manager'
					)
				) {
					throw new Error('Unauthorized');
				}

				const rejected =
					await this.repository.getRejectedStudentsForTerm(termId);
				if (rejected.length === 0) {
					return { moved: 0, skipped: 0 };
				}

				const stdNos = [...new Set(rejected.map((r) => r.stdNo))];
				const alreadyBlocked =
					await this.repository.getAlreadyBlockedStudents(stdNos);
				const blockedSet = new Set(alreadyBlocked.map((b) => b.stdNo));

				const studentReasons = new Map<number, string[]>();
				for (const r of rejected) {
					if (blockedSet.has(r.stdNo)) continue;
					const reasons = studentReasons.get(r.stdNo) || [];
					if (r.message) {
						reasons.push(`${r.department}: ${r.message}`);
					}
					studentReasons.set(r.stdNo, reasons);
				}

				const toBlock = Array.from(studentReasons.entries()).map(
					([stdNo, reasons]) => ({
						stdNo,
						reason: reasons.join('; ') || 'Registration rejected',
						byDepartment: 'registry',
					})
				);

				await this.repository.bulkCreateBlockedStudents(toBlock);

				return {
					moved: toBlock.length,
					skipped: blockedSet.size,
				};
			},
			['admin', 'registry']
		);
	}

	async getUnpublishedTermCodes() {
		return withAuth(
			async () => this.repository.getUnpublishedTermCodes(),
			['all']
		);
	}

	async getPublicationAttachments(termCode: string) {
		return withAuth(
			async () => this.repository.getPublicationAttachments(termCode),
			['admin', 'registry']
		);
	}

	async createPublicationAttachment(data: {
		termCode: string;
		fileName: string;
		type: 'scanned-pdf' | 'raw-marks' | 'other';
	}) {
		return withAuth(
			async (session) => {
				if (
					session?.user?.role !== 'admin' &&
					!(
						session?.user?.role === 'registry' &&
						session?.user?.position === 'manager'
					)
				) {
					throw new Error('Unauthorized');
				}
				return this.repository.createPublicationAttachment({
					...data,
					createdBy: session.user.id!,
				});
			},
			['admin', 'registry']
		);
	}

	async deletePublicationAttachment(id: string) {
		return withAuth(
			async (session) => {
				if (
					session?.user?.role !== 'admin' &&
					!(
						session?.user?.role === 'registry' &&
						session?.user?.position === 'manager'
					)
				) {
					throw new Error('Unauthorized');
				}
				return this.repository.deletePublicationAttachment(id);
			},
			['admin', 'registry']
		);
	}
}

export const termSettingsService = serviceWrapper(
	TermSettingsService,
	'TermSettingsService'
);
