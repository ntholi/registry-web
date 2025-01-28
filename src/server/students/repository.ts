import BaseRepository from '@/server/base/BaseRepository';
import { students } from '@/db/schema';

export default class StudentRepository extends BaseRepository<
  typeof students,
  'stdNo'
> {
  constructor() {
    super(students, 'stdNo');
  }
}

export const studentsRepository = new StudentRepository();
