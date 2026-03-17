import { getUserSchoolIds } from '@admin/users';
import type { studentFeedbackCycles } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import { generateUniquePassphrases } from '../../_shared/lib/passphrase';
import StudentFeedbackCycleRepository from './repository';

class StudentFeedbackCycleService extends BaseService<
	typeof studentFeedbackCycles,
	'id'
> {
	private repo: StudentFeedbackCycleRepository;

	constructor() {
		const repo = new StudentFeedbackCycleRepository();
		super(repo, {
			findAllAuth: { 'student-feedback-cycles': ['read'] },
			byIdAuth: { 'student-feedback-cycles': ['read'] },
			createAuth: { 'student-feedback-cycles': ['create'] },
			updateAuth: { 'student-feedback-cycles': ['update'] },
			deleteAuth: { 'student-feedback-cycles': ['delete'] },
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
			{ 'student-feedback-cycles': ['read'] }
		);
	}

	async createWithSchools(
		data: typeof studentFeedbackCycles.$inferInsert,
		schoolIds: number[]
	) {
		return withPermission(
			async () => this.repo.createWithSchools(data, schoolIds),
			{ 'student-feedback-cycles': ['create'] }
		);
	}

	async updateWithSchools(
		id: string,
		data: typeof studentFeedbackCycles.$inferInsert,
		schoolIds: number[]
	) {
		return withPermission(
			async () => this.repo.updateWithSchools(id, data, schoolIds),
			{ 'student-feedback-cycles': ['update'] }
		);
	}

	async getClassesForCycle(cycleId: string, termId: number) {
		return withPermission(
			async () => this.repo.getClassesForCycle(cycleId, termId),
			{ 'student-feedback-cycles': ['read'] }
		);
	}

	async getPassphraseStats(cycleId: string) {
		return withPermission(async () => this.repo.getPassphraseStats(cycleId), {
			'student-feedback-cycles': ['read'],
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
			{ 'student-feedback-cycles': ['update'] }
		);
	}

	async getPassphrasesForClass(cycleId: string, structureSemesterId: number) {
		return withPermission(
			async () =>
				this.repo.getPassphrasesForClass(cycleId, structureSemesterId),
			{ 'student-feedback-cycles': ['read'] }
		);
	}
}

export const studentFeedbackCyclesService = serviceWrapper(
	StudentFeedbackCycleService,
	'StudentFeedbackCyclesService'
);
