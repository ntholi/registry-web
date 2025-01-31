import BaseRepository from '@/server/base/BaseRepository';
import { registrationRequests } from '@/db/schema'

export default class RegistrationRequestRepository extends BaseRepository<
  typeof registrationRequests,
  'id'
> {
  constructor() {
    super(registrationRequests, 'id');
  }
}

export const registrationRequestsRepository = new RegistrationRequestRepository();