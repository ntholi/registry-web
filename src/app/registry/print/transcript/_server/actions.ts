'use server';

import type { transcriptPrints } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { transcriptPrintsService as service } from './service';

type TranscriptPrint = typeof transcriptPrints.$inferInsert;

export const createTranscriptPrint = createAction(
	async (data: TranscriptPrint) => {
		return service.create(data);
	}
);
