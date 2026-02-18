import type { feedbackPeriods } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import { generateUniquePassphrases } from '../../_shared/lib/passphrase';
import FeedbackPeriodRepository from './repository';

class FeedbackPeriodService extends BaseService<typeof feedbackPeriods, 'id'> {
	private repo: FeedbackPeriodRepository;

	constructor() {
		const repo = new FeedbackPeriodRepository();
		super(repo, {
			findAllRoles: ['academic', 'admin'],
			byIdRoles: ['academic', 'admin'],
			createRoles: ['academic', 'admin'],
			updateRoles: ['academic', 'admin'],
			deleteRoles: ['academic', 'admin'],
		});
		this.repo = repo;
	}

	async getClassesForTerm(termId: number) {
		return withAuth(
			async () => this.repo.getClassesForTerm(termId),
			['academic', 'admin']
		);
	}

	async getPassphraseStats(periodId: number) {
		return withAuth(
			async () => this.repo.getPassphraseStats(periodId),
			['academic', 'admin']
		);
	}

	async generatePassphrases(
		periodId: number,
		structureSemesterId: number,
		studentCount: number
	) {
		return withAuth(async () => {
			const count = studentCount + Math.ceil(studentCount * 0.1);
			const existing = await this.repo.getExistingPassphrases(periodId);
			const passphrases = generateUniquePassphrases(count, existing);
			await this.repo.createPassphrases(
				passphrases.map((passphrase) => ({
					periodId,
					structureSemesterId,
					passphrase,
				}))
			);
			return count;
		}, ['academic', 'admin']);
	}

	async getPassphrasesForClass(periodId: number, structureSemesterId: number) {
		return withAuth(
			async () =>
				this.repo.getPassphrasesForClass(periodId, structureSemesterId),
			['academic', 'admin']
		);
	}
}

export const feedbackPeriodsService = serviceWrapper(
	FeedbackPeriodService,
	'FeedbackPeriodsService'
);
