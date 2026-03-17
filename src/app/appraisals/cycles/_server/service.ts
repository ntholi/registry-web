import { getUserSchoolIds } from '@admin/users';
import type { feedbackCycles } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import { generateUniquePassphrases } from '../../student-feedback/_shared/lib/passphrase';
import FeedbackCycleRepository from './repository';

class FeedbackCycleService extends BaseService<typeof feedbackCycles, 'id'> {
	private repo: FeedbackCycleRepository;

	constructor() {
		const repo = new FeedbackCycleRepository();
		super(repo, {
			findAllAuth: { 'feedback-cycles': ['read'] },
			byIdAuth: { 'feedback-cycles': ['read'] },
			createAuth: { 'feedback-cycles': ['create'] },
			updateAuth: { 'feedback-cycles': ['update'] },
			deleteAuth: { 'feedback-cycles': ['delete'] },
			activityTypes: {
				create: 'student_feedback_cycle_created',
				update: 'student_feedback_cycle_updated',
				delete: 'student_feedback_cycle_deleted',
			},
		});
		this.repo = repo;
	}

	async findAllWithSchoolCodes(
		params: Parameters<typeof this.repo.queryWithSchoolCodes>[0]
	) {
		return withPermission(
			async (session) => {
				const userSchoolIds = await getUserSchoolIds(session?.user?.id);
				return this.repo.queryWithSchoolCodes(params, userSchoolIds);
			},
			{ 'feedback-cycles': ['read'] }
		);
	}

	async createWithSchools(
		data: typeof feedbackCycles.$inferInsert,
		schoolIds: number[]
	) {
		return withPermission(
			async () => this.repo.createWithSchools(data, schoolIds),
			{ 'feedback-cycles': ['create'] }
		);
	}

	async updateWithSchools(
		id: string,
		data: typeof feedbackCycles.$inferInsert,
		schoolIds: number[]
	) {
		return withPermission(
			async () => this.repo.updateWithSchools(id, data, schoolIds),
			{ 'feedback-cycles': ['update'] }
		);
	}

	async getClassesForCycle(cycleId: string, termId: number) {
		return withPermission(
			async () => this.repo.getClassesForCycle(cycleId, termId),
			{ 'feedback-cycles': ['read'] }
		);
	}

	async getPassphraseStats(cycleId: string) {
		return withPermission(async () => this.repo.getPassphraseStats(cycleId), {
			'feedback-cycles': ['read'],
		});
	}

	async generatePassphrases(
		cycleId: string,
		structureSemesterId: number,
		passphraseCount: number
	) {
		return withPermission(
			async () => {
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
			},
			{ 'feedback-cycles': ['update'] }
		);
	}

	async getPassphrasesForClass(cycleId: string, structureSemesterId: number) {
		return withPermission(
			async () =>
				this.repo.getPassphrasesForClass(cycleId, structureSemesterId),
			{ 'feedback-cycles': ['read'] }
		);
	}
}

export const feedbackCyclesService = serviceWrapper(
	FeedbackCycleService,
	'feedbackCyclesService'
);
