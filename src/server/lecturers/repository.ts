import BaseRepository from '@/server/base/BaseRepository';
import { lecturers } from '@/db/schema'

export default class LecturerRepository extends BaseRepository<
  typeof lecturers,
  'id'
> {
  constructor() {
    super(lecturers, 'id');
  }
}

export const lecturersRepository = new LecturerRepository();