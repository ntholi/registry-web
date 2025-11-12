import type { QueryOptions } from '@server/base/BaseRepository';
import { eq } from 'drizzle-orm';
import { serviceWrapper } from '@/server/base/serviceWrapper';
import withAuth from '@/server/base/withAuth';
import { db } from '@/shared/db';
import { transcriptPrints } from '@/shared/db/schema';
import TranscriptPrintsRepository from './repository';

type TranscriptPrint = typeof transcriptPrints.$inferInsert;

class TranscriptPrintsService {
	constructor(private readonly repository = new TranscriptPrintsRepository()) {}

	async create(data: TranscriptPrint) {
		return withAuth(async () => this.repository.create(data), ['dashboard']);
	}

	async findAll(params: QueryOptions<typeof transcriptPrints>) {
		return withAuth(async () => this.repository.query(params), ['dashboard']);
	}

	async get(id: string) {
		return withAuth(async () => this.repository.findById(id), ['all']);
	}

	async findByStudent(stdNo: number) {
		return withAuth(
			async () =>
				db.query.transcriptPrints.findMany({
					where: eq(transcriptPrints.stdNo, stdNo),
					orderBy: (table, { desc }) => [desc(table.printedAt)],
				}),
			['dashboard']
		);
	}

	async count() {
		return withAuth(async () => this.repository.count(), ['dashboard']);
	}
}

export const transcriptPrintsService = serviceWrapper(
	TranscriptPrintsService,
	'TranscriptPrintsService'
);
