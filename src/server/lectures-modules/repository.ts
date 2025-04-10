import BaseRepository from '@/server/base/BaseRepository';
import { lecturesModules } from '@/db/schema'

export default class LecturesModuleRepository extends BaseRepository<
  typeof lecturesModules,
  'id'
> {
  constructor() {
    super(lecturesModules, 'id');
  }
}

export const lecturesModulesRepository = new LecturesModuleRepository();