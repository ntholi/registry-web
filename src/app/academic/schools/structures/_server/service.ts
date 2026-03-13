import type { structureSemesters, structures } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import {
	requireSessionUserId,
	withPermission,
} from '@/core/platform/withPermission';
import StructureRepository from './repository';

class StructureService extends BaseService<typeof structures, 'id'> {
	constructor() {
		super(new StructureRepository(), {
			byIdAuth: 'dashboard',
			findAllAuth: 'dashboard',
			updateAuth: { 'school-structures': ['update'] },
			deleteAuth: { 'school-structures': ['delete'] },
			activityTypes: {
				create: 'structure_created',
				update: 'structure_updated',
			},
		});
	}

	override async get(id: number) {
		return withPermission(
			async () => (this.repository as StructureRepository).findById(id),
			'dashboard'
		);
	}

	async getByProgramId(programId: number) {
		return withPermission(
			async () =>
				(this.repository as StructureRepository).findByProgramId(programId),
			'dashboard'
		);
	}

	async getStructureModules(structureId: number) {
		return withPermission(
			async () =>
				(this.repository as StructureRepository).getStructureModules(
					structureId
				),
			'dashboard'
		);
	}

	async getStructureSemestersByStructureId(structureId: number) {
		return withPermission(
			async () =>
				(
					this.repository as StructureRepository
				).getStructureSemestersByStructureId(structureId),
			'dashboard'
		);
	}

	async createStructureSemester(data: typeof structureSemesters.$inferInsert) {
		return withPermission(
			async (session) =>
				(this.repository as StructureRepository).createStructureSemester(data, {
					userId: requireSessionUserId(session),
					activityType: 'structure_semester_created',
				}),
			{ 'school-structures': ['update'] }
		);
	}
}

export const structuresService = serviceWrapper(
	StructureService,
	'StructuresService'
);
