import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import TermSettingsRepository from './settings-repository';

class TermSettingsService {
	private repository = new TermSettingsRepository();

	async findByTermId(termId: number) {
		return withAuth(
			async () => this.repository.findByTermId(termId),
			['admin', 'registry']
		);
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
					startDate,
					endDate,
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

	async hasRejectedStudentsForTerm(termId: number) {
		return withAuth(
			async () => this.repository.hasRejectedStudentsForTerm(termId),
			['admin', 'registry']
		);
	}
}

export const termSettingsService = serviceWrapper(
	TermSettingsService,
	'TermSettingsService'
);
