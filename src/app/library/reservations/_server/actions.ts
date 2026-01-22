'use server';

import { auth } from '@/core/auth';
import type { ReservationFilters } from '../_lib/types';
import { reservationsService } from './service';

export async function getReservation(id: string) {
	return reservationsService.getWithRelations(id);
}

export async function getReservations(page = 1, search = '', filters?: ReservationFilters) {
	return reservationsService.getReservationHistory(page, search, filters);
}

export async function getActiveReservations() {
	return reservationsService.findActiveReservations();
}

export async function getExpiredReservations() {
	return reservationsService.findExpiredReservations();
}

export async function getStudentReservations(stdNo: number, status?: string) {
	return reservationsService.findByStudent(stdNo, status);
}

export async function createReservation(
	bookId: string,
	stdNo: number,
	expiryDate: Date,
	notes?: string
) {
	const session = await auth();
	const reservedBy = session?.user?.id;
	return reservationsService.createReservation(bookId, stdNo, expiryDate, reservedBy, notes);
}

export async function cancelReservation(id: string) {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Unauthorized');
	return reservationsService.cancelReservation(id, session.user.id);
}

export async function fulfillReservation(id: string) {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Unauthorized');
	return reservationsService.fulfillReservation(id, session.user.id);
}

export async function markReservationExpired(id: string) {
	return reservationsService.markExpired(id);
}

export async function searchStudents(query: string) {
	if (!query || query.length < 2) return [];
	return reservationsService.searchStudents(query);
}

export async function searchBooks(query: string) {
	if (!query || query.length < 2) return [];
	return reservationsService.searchBooks(query);
}

export async function deleteReservation(id: string) {
	return reservationsService.delete(id);
}

export async function hasActiveReservation(bookId: string, stdNo: number) {
	return reservationsService.hasActiveReservation(bookId, stdNo);
}
