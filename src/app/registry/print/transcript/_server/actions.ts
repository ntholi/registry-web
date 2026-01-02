'use server';

import type { transcriptPrints } from '@/core/database';
import { transcriptPrintsService as service } from './service';

type TranscriptPrint = typeof transcriptPrints.$inferInsert;

export async function createTranscriptPrint(data: TranscriptPrint) {
	return service.create(data);
}
