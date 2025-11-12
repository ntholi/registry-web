import { transcriptPrints } from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';

export default class TranscriptPrintRepository extends BaseRepository<
	typeof transcriptPrints,
	'id'
> {
	constructor() {
		super(transcriptPrints, transcriptPrints.id);
	}
}

export const transcriptPrintsRepository = new TranscriptPrintRepository();
