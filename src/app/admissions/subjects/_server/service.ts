import type { Session } from '@/core/auth';
import { hasPermission } from '@/core/auth/permissions';
import type { subjects } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import SubjectRepository from './repository';

function canManageSubjects(
	session: Session | null | undefined,
	action: 'read' | 'create' | 'update' | 'delete'
) {
	return hasPermission(session, 'subjects', action);
}

function isApplicantSession(session: Session | null | undefined) {
	return session?.user?.role === 'applicant' || session?.user?.role === 'user';
}

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
				canManageSubjects(session, 'create') || isApplicantSession(session)
		);
	}

	async findActive() {
		return withPermission(
			async () => this.repo.findActive(),
			async (session) =>
				canManageSubjects(session, 'read') || isApplicantSession(session)
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
					throw new Error('SUBJECT_IN_USE: Cannot delete subject in use');
				}
				return this.repo.delete(id, this.buildAuditOptions(session, 'delete'));
			},
			{ subjects: ['delete'] }
		);
	}
}

export const subjectsService = serviceWrapper(SubjectService, 'SubjectService');
