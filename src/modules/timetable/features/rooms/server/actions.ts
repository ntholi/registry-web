'use server';

import type { rooms } from '@/core/database/schema';
import type { RoomInsert } from './repository';
import { roomService as service } from './service';

type Room = typeof rooms.$inferInsert;

export async function getRoom(id: number) {
	return service.get(id);
}

export async function getRoomWithRelations(id: number) {
	return service.getWithRelations(id);
}

export async function findAllRooms(page = 1, search = '') {
	return service.findAll({
		page,
		search,
		searchColumns: ['name'],
		sort: [{ column: 'name', order: 'asc' }],
	});
}

export async function getAllRooms() {
	return service.getAll();
}

export async function createRoom(room: RoomInsert, schoolIds: number[]) {
	return service.createWithSchools(room, schoolIds);
}

export async function updateRoom(
	id: number,
	room: Partial<Room>,
	schoolIds?: number[]
) {
	return service.updateWithSchools(id, room, schoolIds);
}

export async function deleteRoom(id: number) {
	return service.delete(id);
}
