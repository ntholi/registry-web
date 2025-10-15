import BaseRepository from '@/server/base/BaseRepository';
import { tasks } from '@/db/schema'

export default class TaskRepository extends BaseRepository<
  typeof tasks,
  'id'
> {
  constructor() {
    super(tasks, 'id');
  }
}

export const tasksRepository = new TaskRepository();