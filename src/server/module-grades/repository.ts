import BaseRepository from '@/server/base/BaseRepository';
import { moduleGrades } from '@/db/schema'

export default class ModuleGradeRepository extends BaseRepository<
  typeof moduleGrades,
  'id'
> {
  constructor() {
    super(moduleGrades, 'id');
  }
}

export const moduleGradesRepository = new ModuleGradeRepository();