import BaseRepository from '@/server/base/BaseRepository';
import { transcriptPrints } from '@/shared/db/schema';

export default class TranscriptPrintRepository extends BaseRepository<
	typeof transcriptPrints,
	'id'
> {
	constructor() {
		super(transcriptPrints, transcriptPrints.id);
	}
}

export const transcriptPrintsRepository = new TranscriptPrintRepository();
