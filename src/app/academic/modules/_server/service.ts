import type { modules } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import ModuleRepository from './repository';

class ModuleService extends BaseService<typeof modules, 'id'> {
	constructor() {
		super(new ModuleRepository(), {
			byIdAuth: 'dashboard',
			findAllAuth: 'dashboard',
			createAuth: { modules: ['create'] },
			activityTypes: {
				create: 'module_created',
				update: 'module_updated',
				delete: 'module_deleted',
			},
		});
	}

	override async get(id: number) {
		return withPermission(
			async () => (this.repository as ModuleRepository).findById(id),
			'dashboard'
		);
	}
}

export const modulesService = serviceWrapper(ModuleService, 'ModuleService');
