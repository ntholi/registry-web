import BaseRepository from '@/server/base/BaseRepository';
import { assessments } from '@/db/schema'

export default class AssessmentRepository extends BaseRepository<
  typeof assessments,
  'id'
> {
  constructor() {
    super(assessments, 'id');
  }
}

export const assessmentsRepository = new AssessmentRepository();