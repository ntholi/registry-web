import type { QueryOptions } from '@server/base/BaseRepository';
import { eq } from 'drizzle-orm';
import { db } from '@/core/db';
import { statementOfResultsPrints } from '@/core/db/schema';
import { serviceWrapper } from '@/server/base/serviceWrapper';
import withAuth from '@/server/base/withAuth';
import StatementOfResultsPrintsRepository from './repository';

type StatementOfResultsPrint = typeof statementOfResultsPrints.$inferInsert;

class StatementOfResultsPrintsService {
	constructor(
		private readonly repository = new StatementOfResultsPrintsRepository()
	) {}

	async create(data: StatementOfResultsPrint) {
		return withAuth(async () => this.repository.create(data), ['dashboard']);
	}

	async findAll(params: QueryOptions<typeof statementOfResultsPrints>) {
		return withAuth(async () => this.repository.query(params), ['dashboard']);
	}

	async get(id: string) {
		return withAuth(async () => this.repository.findById(id), ['all']);
	}

	async findByStudent(stdNo: number) {
		return withAuth(
			async () =>
				db.query.statementOfResultsPrints.findMany({
					where: eq(statementOfResultsPrints.stdNo, stdNo),
					orderBy: (table, { desc }) => [desc(table.printedAt)],
				}),
			['dashboard']
		);
	}

	async count() {
		return withAuth(async () => this.repository.count(), ['dashboard']);
	}
}

export const statementOfResultsPrintsService = serviceWrapper(
	StatementOfResultsPrintsService,
	'StatementOfResultsPrintsService'
);
