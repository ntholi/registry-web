import type { reservations } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import type { ReservationFilters } from '../_lib/types';
import ReservationRepository from './repository';

class ReservationService extends BaseService<typeof reservations, 'id'> {
	declare repository: ReservationRepository;

	constructor() {
		super(new ReservationRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['dashboard'],
			updateRoles: ['dashboard'],
			deleteRoles: ['dashboard'],
		});
	}

	async getWithRelations(id: string) {
		return this.repository.findByIdWithRelations(id);
	}

	async findByStudent(stdNo: number, status?: string) {
		return this.repository.findByStudent(stdNo, status);
	}

	async findActiveReservations() {
		return this.repository.findActiveReservations();
	}

	async findExpiredReservations() {
		return this.repository.findExpiredReservations();
	}

	async createReservation(
		bookId: string,
		stdNo: number,
		expiryDate: Date,
		reservedBy?: string,
		notes?: string
	) {
		return this.repository.createReservation({
			bookId,
			stdNo,
			expiryDate,
			reservedBy,
			notes,
		});
	}

	async cancelReservation(id: string, cancelledBy: string) {
		return this.repository.cancelReservation(id, cancelledBy);
	}

	async fulfillReservation(id: string, fulfilledBy: string) {
		return this.repository.fulfillReservation(id, fulfilledBy);
	}

	async markExpired(id: string) {
		return this.repository.markExpired(id);
	}

	async getReservationHistory(page: number, search: string, filters?: ReservationFilters) {
		return this.repository.getReservationHistory(page, search, filters);
	}

	async searchStudents(query: string) {
		return this.repository.searchStudents(query);
	}

	async searchBooks(query: string) {
		return this.repository.searchBooks(query);
	}

	async getStudentActiveReservationsCount(stdNo: number) {
		return this.repository.getStudentActiveReservationsCount(stdNo);
	}

	async hasActiveReservation(bookId: string, stdNo: number) {
		return this.repository.hasActiveReservation(bookId, stdNo);
	}
}

export const reservationsService = serviceWrapper(ReservationService, 'ReservationService');
