import { transcriptPrints } from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';

export default class TranscriptPrintsRepository extends BaseRepository<
  typeof transcriptPrints,
  'id'
> {
  constructor() {
    super(transcriptPrints, 'id');
  }
}

export const transcriptPrintsRepository = new TranscriptPrintsRepository();
