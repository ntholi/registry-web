import type { statementOfResultsPrints } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import StatementOfResultsPrintsRepository from './repository';

type StatementOfResultsPrint = typeof statementOfResultsPrints.$inferInsert;

class StatementOfResultsPrintsService {
	constructor(
		private readonly repository = new StatementOfResultsPrintsRepository()
	) {}

	async create(data: StatementOfResultsPrint) {
		return withPermission(
			async (session) =>
				this.repository.create(data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'statement_of_results_print',
					stdNo: data.stdNo,
				}),
			['dashboard']
		);
	}

	async get(id: string) {
		return withPermission(async () => this.repository.findById(id), ['all']);
	}
}

export const statementOfResultsPrintsService = serviceWrapper(
	StatementOfResultsPrintsService,
	'StatementOfResultsPrintsService'
);
