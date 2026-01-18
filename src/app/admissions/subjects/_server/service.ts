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
			byIdRoles: ['registry', 'admin'],
			findAllRoles: ['registry', 'admin'],
			createRoles: ['registry', 'admin'],
			updateRoles: ['registry', 'admin'],
			deleteRoles: ['registry', 'admin'],
		});
		this.repo = repo;
	}

	async findOrCreateByName(name: string) {
		return withAuth(
			async () => this.repo.findOrCreateByName(name),
			['registry', 'admin']
		);
	}

	async findActive() {
		return withAuth(async () => this.repo.findActive(), ['registry', 'admin']);
	}

	async toggleActive(id: number) {
		return withAuth(
			async () => this.repo.toggleActive(id),
			['registry', 'admin']
		);
	}

	async addAlias(subjectId: number, alias: string) {
		return withAuth(
			async () => this.repo.addAlias(subjectId, alias),
			['registry', 'admin']
		);
	}

	async removeAlias(aliasId: number) {
		return withAuth(
			async () => this.repo.removeAlias(aliasId),
			['registry', 'admin']
		);
	}

	async getAliases(subjectId: number) {
		return withAuth(
			async () => this.repo.getAliases(subjectId),
			['registry', 'admin']
		);
	}

	override async delete(id: number) {
		return withAuth(async () => {
			const isInUse = await this.repo.isInUse(id);
			if (isInUse) {
				throw new Error('SUBJECT_IN_USE: Cannot delete subject in use');
			}
			return this.repo.delete(id);
		}, ['registry', 'admin']);
	}
}

export const subjectsService = serviceWrapper(SubjectService, 'SubjectService');
