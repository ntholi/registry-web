import type { rooms } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type { RoomInsert } from './repository';
import RoomRepository from './repository';

class RoomService extends BaseService<typeof rooms, 'id'> {
	private roomRepository: RoomRepository;

	constructor() {
		const repository = new RoomRepository();
		super(repository, {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
		});
		this.roomRepository = repository;
	}

	getWithRelations = async (id: number) => {
		return withAuth(async () => {
			return this.roomRepository.findByIdWithRelations(id);
		}, ['dashboard']);
	};

	createWithSchools = async (room: RoomInsert, schoolIds: number[]) => {
		return withAuth(async () => {
			return this.roomRepository.createWithSchools(room, schoolIds);
		}, ['academic', 'registry']);
	};

	updateWithSchools = async (
		id: number,
		room: Partial<RoomInsert>,
		schoolIds?: number[]
	) => {
		return withAuth(async () => {
			return this.roomRepository.updateWithSchools(id, room, schoolIds);
		}, []);
	};
}

export const roomService = serviceWrapper(RoomService, 'RoomService');
