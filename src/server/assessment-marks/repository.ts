import BaseRepository from '@/server/base/BaseRepository';
import { assessmentMarks } from '@/db/schema'

export default class AssessmentMarkRepository extends BaseRepository<
  typeof assessmentMarks,
  'id'
> {
  constructor() {
    super(assessmentMarks, 'id');
  }
}

export const assessmentMarksRepository = new AssessmentMarkRepository();