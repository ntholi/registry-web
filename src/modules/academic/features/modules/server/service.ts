import type { modules } from '@/core/database/schema';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import ModuleRepository from './repository';

class ModuleService extends BaseService<typeof modules, 'id'> {
	constructor() {
		super(new ModuleRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
		});
	}
}

export const modulesService = serviceWrapper(ModuleService, 'ModuleService');
