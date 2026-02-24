import type { statementOfResultsPrints } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import StatementOfResultsPrintsRepository from './repository';

type StatementOfResultsPrint = typeof statementOfResultsPrints.$inferInsert;

class StatementOfResultsPrintsService {
	constructor(
		private readonly repository = new StatementOfResultsPrintsRepository()
	) {}

	async create(data: StatementOfResultsPrint) {
		return withAuth(
			async (session) =>
				this.repository.create(data, {
					userId: session!.user!.id!,
				}),
			['dashboard']
		);
	}

	async get(id: string) {
		return withAuth(async () => this.repository.findById(id), ['all']);
	}
}

export const statementOfResultsPrintsService = serviceWrapper(
	StatementOfResultsPrintsService,
	'StatementOfResultsPrintsService'
);
