import BaseRepository from '@/server/base/BaseRepository';
import { schools } from '@/db/schema';

export default class SchoolRepository extends BaseRepository<typeof schools, 'id'> {
  constructor() {
    super(schools, 'id');
  }
}

export const schoolsRepository = new SchoolRepository();