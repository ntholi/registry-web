import BaseRepository from '@/server/base/BaseRepository';
import { graduationLists } from '@/db/schema'

export default class GraduationListRepository extends BaseRepository<
  typeof graduationLists,
  'id'
> {
  constructor() {
    super(graduationLists, 'id');
  }
}

export const graduationListsRepository = new GraduationListRepository();