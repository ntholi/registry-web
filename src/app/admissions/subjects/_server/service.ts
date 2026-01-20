import type { subjects } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import SubjectRepository from './repository';

class SubjectService extends BaseService<typeof subjects, 'id'> {
	private repo: SubjectRepository;

	constructor() {
		const repo = new SubjectRepository();
		super(repo, {
			byIdRoles: ['registry', 'marketing', 'admin'],
			findAllRoles: ['registry', 'marketing', 'admin'],
			createRoles: ['registry', 'marketing', 'admin'],
			updateRoles: ['registry', 'marketing', 'admin'],
			deleteRoles: ['registry', 'marketing', 'admin'],
		});
		this.repo = repo;
	}

	async findOrCreateByName(name: string) {
		return withAuth(
			async () => this.repo.findOrCreateByName(name),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async findActive() {
		return withAuth(
			async () => this.repo.findActive(),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async toggleActive(id: string) {
		return withAuth(
			async () => this.repo.toggleActive(id),
			['registry', 'marketing', 'admin']
		);
	}

	async addAlias(subjectId: string, alias: string) {
		return withAuth(
			async () => this.repo.addAlias(subjectId, alias),
			['registry', 'marketing', 'admin']
		);
	}

	async removeAlias(aliasId: string) {
		return withAuth(
			async () => this.repo.removeAlias(aliasId),
			['registry', 'marketing', 'admin']
		);
	}

	async getAliases(subjectId: string) {
		return withAuth(
			async () => this.repo.getAliases(subjectId),
			['registry', 'marketing', 'admin']
		);
	}

	override async delete(id: string) {
		return withAuth(async () => {
			const isInUse = await this.repo.isInUse(id);
			if (isInUse) {
				throw new Error('SUBJECT_IN_USE: Cannot delete subject in use');
			}
			return this.repo.delete(id);
		}, ['registry', 'marketing', 'admin']);
	}
}

export const subjectsService = serviceWrapper(SubjectService, 'SubjectService');
