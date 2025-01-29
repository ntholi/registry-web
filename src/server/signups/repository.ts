import BaseRepository from '@/server/base/BaseRepository';
import { signups } from '@/db/schema';

export default class SignupRepository extends BaseRepository<
  typeof signups,
  'userId'
> {
  constructor() {
    super(signups, 'userId');
  }
}

export const signupsRepository = new SignupRepository();
