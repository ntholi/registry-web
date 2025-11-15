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

	getWithRelations = async (id: number) => {
		return withAuth(async () => {
			return this.lecturerAllocationRepository.findByIdWithRelations(id);
		}, ['dashboard']);
	};

	getAllWithRelations = async () => {
		return withAuth(async () => {
			return this.lecturerAllocationRepository.findAllWithRelations();
		}, ['dashboard']);
	};

	getByUserAndTerm = async (userId: string, termId: number) => {
		return withAuth(async () => {
			return this.lecturerAllocationRepository.findByUserAndTerm(
				userId,
				termId
			);
		}, ['dashboard']);
	};

	getByUserIdWithRelations = async (userId: string) => {
		return withAuth(async () => {
			return this.lecturerAllocationRepository.findByUserIdWithRelations(
				userId
			);
		}, ['dashboard']);
	};

	getUniqueLecturers = async () => {
		return withAuth(async () => {
			return this.lecturerAllocationRepository.findUniqueLecturers();
		}, ['dashboard']);
	};

	createMany = async (allocations: LecturerAllocationInsert[]) => {
		return withAuth(async () => {
			return this.lecturerAllocationRepository.createMany(allocations);
		}, []);
	};

	deleteByUserAndTerm = async (userId: string, termId: number) => {
		return withAuth(async () => {
			return this.lecturerAllocationRepository.deleteByUserAndTerm(
				userId,
				termId
			);
		}, []);
	};
}

export const lecturerAllocationService = serviceWrapper(
	LecturerAllocationService,
	'LecturerAllocationService'
);
