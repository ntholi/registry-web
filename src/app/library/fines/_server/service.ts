import type { fines } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import type { FineStatus } from '../_lib/types';
import FineRepository from './repository';

class FineService extends BaseService<typeof fines, 'id'> {
	declare repository: FineRepository;

	constructor() {
		super(new FineRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['dashboard'],
			updateRoles: ['dashboard'],
			deleteRoles: ['dashboard'],
			activityTypes: {
				create: 'fine_created',
				update: 'fine_updated',
			},
		});
	}

	async getWithRelations(id: string) {
		return this.repository.findByIdWithRelations(id);
	}

	async findByStudent(stdNo: number) {
		return this.repository.findByStudent(stdNo);
	}

	async findByStatus(status: FineStatus) {
		return this.repository.findByStatus(status);
	}

	async findByLoan(loanId: string) {
		return this.repository.findByLoan(loanId);
	}

	async createFine(
		loanId: string,
		stdNo: number,
		amount: number,
		daysOverdue: number
	) {
		return this.repository.createFine(loanId, stdNo, amount, daysOverdue);
	}

	async markPaid(id: string, receiptId: string) {
		return this.repository.markPaid(id, receiptId);
	}

	async getTotalUnpaidByStudent(stdNo: number) {
		return this.repository.getTotalUnpaidByStudent(stdNo);
	}

	async getFines(page: number, search: string, status?: FineStatus) {
		return this.repository.getFinesWithFilters(page, search, status);
	}
}

export const finesService = serviceWrapper(FineService, 'FineService');
