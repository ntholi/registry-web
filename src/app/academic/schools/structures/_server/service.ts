import type { structures } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import StructureRepository from './repository';

class StructureService extends BaseService<typeof structures, 'id'> {
	constructor() {
		super(new StructureRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
		});
	}

	override async get(id: number) {
		return withAuth(
			async () => (this.repository as StructureRepository).findById(id),
			['dashboard']
		);
	}

	async getByProgramId(programId: number) {
		return withAuth(
			async () =>
				(this.repository as StructureRepository).findByProgramId(programId),
			['dashboard']
		);
	}

	async getStructureModules(structureId: number) {
		return withAuth(
			async () =>
				(this.repository as StructureRepository).getStructureModules(
					structureId
				),
			['dashboard']
		);
	}

	async getStructureSemestersByStructureId(structureId: number) {
		return withAuth(
			async () =>
				(
					this.repository as StructureRepository
				).getStructureSemestersByStructureId(structureId),
			['dashboard']
		);
	}
}

export const structuresService = serviceWrapper(
	StructureService,
	'StructuresService'
);
