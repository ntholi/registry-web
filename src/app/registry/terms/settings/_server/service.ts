import { serviceWrapper } from '@/core/platform/serviceWrapper';
import {
	requireSessionUserId,
	withPermission,
} from '@/core/platform/withPermission';
import TermSettingsRepository from './repository';

class TermSettingsService {
	private repository = new TermSettingsRepository();

	async findByTermId(termId: number) {
		return withPermission(async () => this.repository.findByTermId(termId), {
			'terms-settings': ['read'],
		});
	}

	async updateResultsPublished(termId: number, published: boolean) {
		return withPermission(
			async (session) => {
				const userId = requireSessionUserId(session);
				return this.repository.updateResultsPublished(
					termId,
					published,
					userId,
					{ userId, activityType: 'term_settings_updated' }
				);
			},
			{ 'terms-settings': ['update'] }
		);
	}

	async updateGradebookAccess(termId: number, access: boolean) {
		return withPermission(
			async (session) => {
				const userId = requireSessionUserId(session);
				return this.repository.updateGradebookAccess(termId, access, userId, {
					userId,
					activityType: 'term_settings_updated',
				});
			},
			{ 'terms-settings': ['update'] }
		);
	}

	async moveRejectedToBlocked(termId: number) {
		return withPermission(
			async () => {
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
			{ 'terms-settings': ['update'] }
		);
	}

	async getUnpublishedTermCodes() {
		return withPermission(
			async () => this.repository.getUnpublishedTermCodes(),
			{ 'terms-settings': ['read'] }
		);
	}

	async getPublicationAttachments(termCode: string) {
		return withPermission(
			async () => this.repository.getPublicationAttachments(termCode),
			{ 'terms-settings': ['read'] }
		);
	}

	async getPublicationAttachment(id: string) {
		return withPermission(
			async () => this.repository.getPublicationAttachment(id),
			{ 'terms-settings': ['read'] }
		);
	}

	async createPublicationAttachment(data: {
		termCode: string;
		fileName: string;
		type: 'scanned-pdf' | 'raw-marks' | 'other';
		storageKey?: string;
	}) {
		return withPermission(
			async (session) => {
				const userId = requireSessionUserId(session);
				return this.repository.createPublicationAttachment({
					...data,
					createdBy: userId,
				});
			},
			{ 'terms-settings': ['update'] }
		);
	}

	async deletePublicationAttachment(id: string) {
		return withPermission(
			async () => {
				return this.repository.deletePublicationAttachment(id);
			},
			{ 'terms-settings': ['update'] }
		);
	}
}

export const termSettingsService = serviceWrapper(
	TermSettingsService,
	'TermSettingsService'
);
