import BaseRepository from '@/server/base/BaseRepository';
import { clearanceResponses } from '@/db/schema'

export default class ClearanceResponseRepository extends BaseRepository<
  typeof clearanceResponses,
  'id'
> {
  constructor() {
    super(clearanceResponses, 'id');
  }
}

export const clearanceResponsesRepository = new ClearanceResponseRepository();