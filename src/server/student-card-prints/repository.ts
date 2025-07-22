import BaseRepository from '@/server/base/BaseRepository';
import { studentCardPrints } from '@/db/schema'

export default class StudentCardPrintRepository extends BaseRepository<
  typeof studentCardPrints,
  'id'
> {
  constructor() {
    super(studentCardPrints, 'id');
  }
}

export const studentCardPrintsRepository = new StudentCardPrintRepository();