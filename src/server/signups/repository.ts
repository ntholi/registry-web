import BaseRepository from '@/server/base/BaseRepository';
import { signups } from '@/db/schema'

export default class SignupRepository extends BaseRepository<
  typeof signups,
  'id'
> {
  constructor() {
    super(signups, 'id');
  }
}

export const signupsRepository = new SignupRepository();