import BaseRepository from '@/server/base/BaseRepository';
import { graduationRequests } from '@/db/schema'

export default class GraduationRequestRepository extends BaseRepository<
  typeof graduationRequests,
  'id'
> {
  constructor() {
    super(graduationRequests, 'id');
  }
}

export const graduationRequestsRepository = new GraduationRequestRepository();