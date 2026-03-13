import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
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
		return withPermission(
			async () => {
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
			},
			{ 'reports-progression': ['read'] }
		);
	}

	async getPaginatedStudents(
		prevTermId: number,
		currTermId: number,
		page: number,
		pageSize: number,
		filter?: ProgressionFilter
	) {
		return withPermission(
			async () => {
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
			},
			{ 'reports-progression': ['read'] }
		);
	}

	async getChartData(
		prevTermId: number,
		currTermId: number,
		filter?: ProgressionFilter
	) {
		return withPermission(
			async () => {
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
			},
			{ 'reports-progression': ['read'] }
		);
	}
}

export const progressionReportService = serviceWrapper(
	ProgressionReportService,
	'ProgressionReportService'
);
