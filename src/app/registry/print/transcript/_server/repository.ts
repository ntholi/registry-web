import { transcriptPrints } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class TranscriptPrintRepository extends BaseRepository<
	typeof transcriptPrints,
	'id'
> {
	protected auditEnabled = false;

	constructor() {
		super(transcriptPrints, transcriptPrints.id);
	}
}

export const transcriptPrintsRepository = new TranscriptPrintRepository();
