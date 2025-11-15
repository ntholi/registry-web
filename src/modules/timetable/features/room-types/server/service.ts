import type { roomTypes } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import RoomTypeRepository from './repository';

class RoomTypeService extends BaseService<typeof roomTypes, 'id'> {
	constructor() {
		super(new RoomTypeRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['academic'],
			updateRoles: ['academic'],
			deleteRoles: ['academic'],
		});
	}
}

export const roomTypeService = serviceWrapper(
	RoomTypeService,
	'RoomTypeService'
);
