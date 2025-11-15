import type { lecturerAllocations } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type { LecturerAllocationInsert } from './repository';
import LecturerAllocationRepository from './repository';

class LecturerAllocationService extends BaseService<
	typeof lecturerAllocations,
	'id'
> {
	private repo: LecturerAllocationRepository;

	constructor() {
		const repository = new LecturerAllocationRepository();
		super(repository, {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
		});
		this.repo = repository;
	}

	async getWithRelations(id: number) {
		return withAuth(async () => {
			return this.repo.findByIdWithRelations(id);
		}, ['dashboard']);
	}

	async getAllWithRelations() {
		return withAuth(async () => {
			return this.repo.findAllWithRelations();
		}, ['dashboard']);
	}

	async getByUserAndTerm(userId: string, termId: number) {
		return withAuth(async () => {
			return this.repo.findByUserAndTerm(userId, termId);
		}, ['dashboard']);
	}

	async createMany(allocations: LecturerAllocationInsert[]) {
		return withAuth(async () => {
			return this.repo.createMany(allocations);
		}, ['academic']);
	}

	async deleteByUserAndTerm(userId: string, termId: number) {
		return withAuth(async () => {
			return this.repo.deleteByUserAndTerm(userId, termId);
		}, []);
	}

	async getByUserIdWithRelations(userId: string) {
		return withAuth(async () => {
			return this.repo.findByUserIdWithRelations(userId);
		}, ['dashboard']);
	}

	async getUniqueLecturers() {
		return withAuth(async () => {
			return this.repo.findUniqueLecturers();
		}, ['dashboard']);
	}
}

export const lecturerAllocationService = serviceWrapper(
	LecturerAllocationService,
	'LecturerAllocationService'
);
