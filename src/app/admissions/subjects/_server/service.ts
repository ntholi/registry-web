import { hasSessionPermission } from '@/core/auth/sessionPermissions';
import type { subjects } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import { UserFacingError } from '@/shared/lib/actions/extractError';
import SubjectRepository from './repository';

class SubjectService extends BaseService<typeof subjects, 'id'> {
	private repo: SubjectRepository;

	constructor() {
		const repo = new SubjectRepository();
		super(repo, {
			byIdAuth: { subjects: ['read'] },
			findAllAuth: { subjects: ['read'] },
			createAuth: { subjects: ['create'] },
			updateAuth: { subjects: ['update'] },
			deleteAuth: { subjects: ['delete'] },
			activityTypes: {
				create: 'subject_created',
				update: 'subject_updated',
				delete: 'subject_deleted',
			},
		});
		this.repo = repo;
	}

	async findOrCreateByName(name: string) {
		return withPermission(
			async () => this.repo.findOrCreateByName(name),
			async (session) =>
				hasSessionPermission(session, 'subjects', 'create', [
					'applicant',
					'user',
				])
		);
	}

	async findActive() {
		return withPermission(
			async () => this.repo.findActive(),
			async (session) =>
				hasSessionPermission(session, 'subjects', 'read', ['applicant', 'user'])
		);
	}

	async toggleActive(id: string) {
		return withPermission(async () => this.repo.toggleActive(id), {
			subjects: ['update'],
		});
	}

	async addAlias(subjectId: string, alias: string) {
		return withPermission(async () => this.repo.addAlias(subjectId, alias), {
			subjects: ['update'],
		});
	}

	async removeAlias(aliasId: string) {
		return withPermission(async () => this.repo.removeAlias(aliasId), {
			subjects: ['update'],
		});
	}

	async getAliases(subjectId: string) {
		return withPermission(async () => this.repo.getAliases(subjectId), {
			subjects: ['read'],
		});
	}

	async moveToAlias(sourceId: string, targetId: string) {
		return withPermission(
			async () => this.repo.moveToAlias(sourceId, targetId),
			{ subjects: ['update'] }
		);
	}

	override async delete(id: string) {
		return withPermission(
			async (session) => {
				const isInUse = await this.repo.isInUse(id);
				if (isInUse) {
					throw new UserFacingError('Cannot delete subject in use');
				}
				return this.repo.delete(id, this.buildAuditOptions(session, 'delete'));
			},
			{ subjects: ['delete'] }
		);
	}
}

export const subjectsService = serviceWrapper(SubjectService, 'SubjectService');
