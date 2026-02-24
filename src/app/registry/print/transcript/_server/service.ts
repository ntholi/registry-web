import type { transcriptPrints } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import TranscriptPrintsRepository from './repository';

type TranscriptPrint = typeof transcriptPrints.$inferInsert;

class TranscriptPrintsService {
	constructor(private readonly repository = new TranscriptPrintsRepository()) {}

	async create(data: TranscriptPrint) {
		return withAuth(
			async (session) =>
				this.repository.create(data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'transcript_print',
					stdNo: data.stdNo,
				}),
			['dashboard']
		);
	}

	async get(id: string) {
		return withAuth(async () => this.repository.findById(id), ['all']);
	}
}

export const transcriptPrintsService = serviceWrapper(
	TranscriptPrintsService,
	'TranscriptPrintsService'
);
