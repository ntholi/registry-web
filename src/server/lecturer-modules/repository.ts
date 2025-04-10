import BaseRepository from '@/server/base/BaseRepository';
import { lecturerModules } from '@/db/schema';

export default class LecturesModuleRepository extends BaseRepository<
  typeof lecturerModules,
  'id'
> {
  constructor() {
    super(lecturerModules, 'id');
  }
}

export const lecturesModulesRepository = new LecturesModuleRepository();
