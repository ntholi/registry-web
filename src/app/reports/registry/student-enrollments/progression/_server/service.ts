import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withPermission';
import {
	type ProgressionFilter,
	ProgressionReportRepository,
} from './repository';

export class ProgressionReportService {
	private repository = new ProgressionReportRepository();

	async getProgressionSummary(
		prevTermId: number,
		currTermId: number,
		filter?: ProgressionFilter
	) {
		return withAuth(async () => {
			const [prevTerm, currTerm] = await Promise.all([
				this.repository.getTermById(prevTermId),
				this.repository.getTermById(currTermId),
			]);
			if (!prevTerm || !currTerm) throw new Error('Term not found');

			return this.repository.getProgressionSummary(
				prevTerm.code,
				currTerm.code,
				filter
			);
		}, ['registry', 'admin', 'finance', 'academic', 'leap']);
	}

	async getPaginatedStudents(
		prevTermId: number,
		currTermId: number,
		page: number,
		pageSize: number,
		filter?: ProgressionFilter
	) {
		return withAuth(async () => {
			const [prevTerm, currTerm] = await Promise.all([
				this.repository.getTermById(prevTermId),
				this.repository.getTermById(currTermId),
			]);
			if (!prevTerm || !currTerm) throw new Error('Term not found');

			return this.repository.getPaginatedProgressionData(
				prevTerm.code,
				currTerm.code,
				page,
				pageSize,
				filter
			);
		}, ['registry', 'admin', 'finance', 'academic', 'leap']);
	}

	async getChartData(
		prevTermId: number,
		currTermId: number,
		filter?: ProgressionFilter
	) {
		return withAuth(async () => {
			const [prevTerm, currTerm] = await Promise.all([
				this.repository.getTermById(prevTermId),
				this.repository.getTermById(currTermId),
			]);
			if (!prevTerm || !currTerm) throw new Error('Term not found');

			return this.repository.getProgressionChartData(
				prevTerm.code,
				currTerm.code,
				filter
			);
		}, ['registry', 'admin', 'finance', 'academic', 'leap']);
	}
}

export const progressionReportService = serviceWrapper(
	ProgressionReportService,
	'ProgressionReportService'
);
