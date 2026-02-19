import type { feedbackCycles } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import { generateUniquePassphrases } from '../../_shared/lib/passphrase';
import FeedbackCycleRepository from './repository';

class FeedbackCycleService extends BaseService<typeof feedbackCycles, 'id'> {
	private repo: FeedbackCycleRepository;

	constructor() {
		const repo = new FeedbackCycleRepository();
		super(repo, {
			findAllRoles: ['academic', 'admin'],
			byIdRoles: ['academic', 'admin'],
			createRoles: ['academic', 'admin'],
			updateRoles: ['academic', 'admin'],
			deleteRoles: ['academic', 'admin'],
		});
		this.repo = repo;
	}

	async createWithSchools(
		data: typeof feedbackCycles.$inferInsert,
		schoolIds: number[]
	) {
		return withAuth(
			async () => this.repo.createWithSchools(data, schoolIds),
			['academic', 'admin']
		);
	}

	async updateWithSchools(
		id: string,
		data: typeof feedbackCycles.$inferInsert,
		schoolIds: number[]
	) {
		return withAuth(
			async () => this.repo.updateWithSchools(id, data, schoolIds),
			['academic', 'admin']
		);
	}

	async getClassesForCycle(cycleId: string, termId: number) {
		return withAuth(
			async () => this.repo.getClassesForCycle(cycleId, termId),
			['academic', 'admin']
		);
	}

	async getPassphraseStats(cycleId: string) {
		return withAuth(
			async () => this.repo.getPassphraseStats(cycleId),
			['academic', 'admin']
		);
	}

	async generatePassphrases(
		cycleId: string,
		structureSemesterId: number,
		passphraseCount: number
	) {
		return withAuth(async () => {
			const count = Math.max(1, Math.floor(passphraseCount));
			const existing = await this.repo.getExistingPassphrases(cycleId);
			const passphrases = generateUniquePassphrases(count, existing);
			await this.repo.createPassphrases(
				passphrases.map((passphrase) => ({
					cycleId,
					structureSemesterId,
					passphrase,
				}))
			);
			return count;
		}, ['academic', 'admin']);
	}

	async getPassphrasesForClass(cycleId: string, structureSemesterId: number) {
		return withAuth(
			async () =>
				this.repo.getPassphrasesForClass(cycleId, structureSemesterId),
			['academic', 'admin']
		);
	}
}

export const feedbackCyclesService = serviceWrapper(
	FeedbackCycleService,
	'FeedbackCyclesService'
);
