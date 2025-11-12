import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { transcriptPrints } from '@/db/schema';
import { serviceWrapper } from '@/server/base/serviceWrapper';
import withAuth from '@/server/base/withAuth';
import type { QueryOptions } from '../../base/BaseRepository';
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
