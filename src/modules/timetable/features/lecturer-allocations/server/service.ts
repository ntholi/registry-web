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
	private lecturerAllocationRepository: LecturerAllocationRepository;

	constructor() {
		const repository = new LecturerAllocationRepository();
		super(repository, {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
		});
		this.lecturerAllocationRepository = repository;
	}

	async getWithRelations(id: number) {
		return withAuth(async () => {
			const repository = this.lecturerAllocationRepository;
			return repository.findByIdWithRelations(id);
		}, ['dashboard']);
	}

	async getAllWithRelations() {
		return withAuth(async () => {
			const repository = this.lecturerAllocationRepository;
			return repository.findAllWithRelations();
		}, ['dashboard']);
	}

	async getByUserAndTerm(userId: string, termId: number) {
		return withAuth(async () => {
			const repository = this.lecturerAllocationRepository;
			return repository.findByUserAndTerm(userId, termId);
		}, ['dashboard']);
	}

	async createMany(allocations: LecturerAllocationInsert[]) {
		return withAuth(async () => {
			const repository = this.lecturerAllocationRepository;
			return repository.createMany(allocations);
		}, ['academic']);
	}

	async deleteByUserAndTerm(userId: string, termId: number) {
		return withAuth(async () => {
			const repository = this.lecturerAllocationRepository;
			return repository.deleteByUserAndTerm(userId, termId);
		}, []);
	}
}

export const lecturerAllocationService = serviceWrapper(
	LecturerAllocationService,
	'LecturerAllocationService'
);
