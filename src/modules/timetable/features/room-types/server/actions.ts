'use server';

import type { roomTypes } from '@/core/database/schema';
import { roomTypeService as service } from './service';

type RoomType = typeof roomTypes.$inferInsert;

export async function getRoomType(id: number) {
	return service.get(id);
}

export async function findAllRoomTypes(page = 1, search = '') {
	return service.findAll({
		page,
		search,
		searchColumns: ['name'],
		sort: [{ column: 'name', order: 'asc' }],
	});
}

export async function getAllRoomTypes() {
	return service.getAll();
}

export async function createRoomType(roomType: RoomType) {
	return service.create(roomType);
}

export async function updateRoomType(id: number, roomType: Partial<RoomType>) {
	return service.update(id, roomType);
}

export async function deleteRoomType(id: number) {
	return service.delete(id);
}
