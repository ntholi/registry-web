import type { structures } from '@/core/database/schema';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import StructureRepository from './repository';

type Structure = typeof structures.$inferInsert;

class StructureService extends BaseService<typeof structures, 'id'> {
	constructor() {
		super(new StructureRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
		});
	}

	async getByProgramId(programId: number) {
		return withAuth(
			async () => (this.repository as StructureRepository).findByProgramId(programId),
			['dashboard']
		);
	}

	async deleteSemesterModule(id: number) {
		withAuth(async () => (this.repository as StructureRepository).deleteSemesterModule(id), []);
	}

	async getStructureModules(structureId: number) {
		return withAuth(
			async () => (this.repository as StructureRepository).getStructureModules(structureId),
			['dashboard']
		);
	}
}

export const structuresService = serviceWrapper(
	StructureService,
	'StructuresService'
);
