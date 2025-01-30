import BaseRepository from '@/server/base/BaseRepository';
import { clearanceRequests } from '@/db/schema'

export default class ClearanceRequestRepository extends BaseRepository<
  typeof clearanceRequests,
  'id'
> {
  constructor() {
    super(clearanceRequests, 'id');
  }
}

export const clearanceRequestsRepository = new ClearanceRequestRepository();