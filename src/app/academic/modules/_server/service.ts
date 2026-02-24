import type { modules } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import ModuleRepository from './repository';

class ModuleService extends BaseService<typeof modules, 'id'> {
	constructor() {
		super(new ModuleRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['registry'],
			activityTypes: {
				create: 'module_created',
				update: 'module_updated',
			},
		});
	}

	override async get(id: number) {
		return withAuth(
			async () => (this.repository as ModuleRepository).findById(id),
			['dashboard']
		);
	}
}

export const modulesService = serviceWrapper(ModuleService, 'ModuleService');
