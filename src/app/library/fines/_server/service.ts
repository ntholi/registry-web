import type { fines } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import type { FineStatus } from '../_lib/types';
import FineRepository from './repository';

class FineService extends BaseService<typeof fines, 'id'> {
	declare repository: FineRepository;

	constructor() {
		super(new FineRepository(), {
			byIdAuth: { library: ['read'] },
			findAllAuth: { library: ['read'] },
			createAuth: { library: ['create'] },
			updateAuth: { library: ['update'] },
			deleteAuth: { library: ['delete'] },
			activityTypes: {
				create: 'fine_created',
				update: 'fine_updated',
				delete: 'fine_deleted',
			},
		});
	}

	async getWithRelations(id: string) {
		return withPermission(() => this.repository.findByIdWithRelations(id), {
			library: ['read'],
		});
	}

	async findByStudent(stdNo: number) {
		return withPermission(() => this.repository.findByStudent(stdNo), {
			library: ['read'],
		});
	}

	async findByStatus(status: FineStatus) {
		return withPermission(() => this.repository.findByStatus(status), {
			library: ['read'],
		});
	}

	async findByLoan(loanId: string) {
		return withPermission(() => this.repository.findByLoan(loanId), {
			library: ['read'],
		});
	}

	async createFine(
		loanId: string,
		stdNo: number,
		amount: number,
		daysOverdue: number
	) {
		return withPermission(
			() => this.repository.createFine(loanId, stdNo, amount, daysOverdue),
			{ library: ['create'] }
		);
	}

	async markPaid(id: string, receiptId: string) {
		return withPermission(() => this.repository.markPaid(id, receiptId), {
			library: ['update'],
		});
	}

	async getTotalUnpaidByStudent(stdNo: number) {
		return withPermission(
			() => this.repository.getTotalUnpaidByStudent(stdNo),
			{ library: ['read'] }
		);
	}

	async getFines(page: number, search: string, status?: FineStatus) {
		return withPermission(
			() => this.repository.getFinesWithFilters(page, search, status),
			{ library: ['read'] }
		);
	}
}

export const finesService = serviceWrapper(FineService, 'FineService');
