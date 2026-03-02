import { getUserSchoolIds } from '@admin/users';
import type { Session } from 'next-auth';
import { auth } from '@/core/auth';
import type { feedbackCycles } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import { generateUniquePassphrases } from '../../_shared/lib/passphrase';
import FeedbackCycleRepository from './repository';

const CRUD_POSITIONS = ['admin', 'manager'];
const VIEW_POSITIONS = ['admin', 'manager', 'year_leader'];

function canManageCycles(session: Session) {
	return Promise.resolve(
		session.user?.role === 'academic' &&
			CRUD_POSITIONS.includes(session.user.position ?? '')
	);
}

function canViewCycles(session: Session) {
	return Promise.resolve(
		session.user?.role === 'academic' &&
			VIEW_POSITIONS.includes(session.user.position ?? '')
	);
}

class FeedbackCycleService extends BaseService<typeof feedbackCycles, 'id'> {
	private repo: FeedbackCycleRepository;

	constructor() {
		const repo = new FeedbackCycleRepository();
		super(repo, {
			findAllRoles: canViewCycles,
			byIdRoles: canViewCycles,
			createRoles: canManageCycles,
			updateRoles: canManageCycles,
			deleteRoles: canManageCycles,
			activityTypes: {
				create: 'feedback_cycle_created',
				update: 'feedback_cycle_updated',
				delete: 'feedback_cycle_deleted',
			},
		});
		this.repo = repo;
	}

	async findAllWithSchoolCodes(
		params: Parameters<typeof this.repo.queryWithSchoolCodes>[0]
	) {
		const session = await auth();
		const userSchoolIds = await getUserSchoolIds(session?.user?.id);
		return withAuth(
			() => this.repo.queryWithSchoolCodes(params, userSchoolIds),
			canViewCycles
		);
	}

	async createWithSchools(
		data: typeof feedbackCycles.$inferInsert,
		schoolIds: number[]
	) {
		return withAuth(
			async () => this.repo.createWithSchools(data, schoolIds),
			canManageCycles
		);
	}

	async updateWithSchools(
		id: string,
		data: typeof feedbackCycles.$inferInsert,
		schoolIds: number[]
	) {
		return withAuth(
			async () => this.repo.updateWithSchools(id, data, schoolIds),
			canManageCycles
		);
	}

	async getClassesForCycle(cycleId: string, termId: number) {
		return withAuth(
			async () => this.repo.getClassesForCycle(cycleId, termId),
			canViewCycles
		);
	}

	async getPassphraseStats(cycleId: string) {
		return withAuth(
			async () => this.repo.getPassphraseStats(cycleId),
			canViewCycles
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
		}, canViewCycles);
	}

	async getPassphrasesForClass(cycleId: string, structureSemesterId: number) {
		return withAuth(
			async () =>
				this.repo.getPassphrasesForClass(cycleId, structureSemesterId),
			canViewCycles
		);
	}
}

export const feedbackCyclesService = serviceWrapper(
	FeedbackCycleService,
	'FeedbackCyclesService'
);
