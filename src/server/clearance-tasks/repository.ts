import BaseRepository from '@/server/base/BaseRepository';
import { clearanceTasks } from '@/db/schema'

export default class ClearanceTaskRepository extends BaseRepository<
  typeof clearanceTasks,
  'id'
> {
  constructor() {
    super(clearanceTasks, 'id');
  }
}

export const clearanceTasksRepository = new ClearanceTaskRepository();