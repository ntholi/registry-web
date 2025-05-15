import BaseRepository from '@/server/base/BaseRepository';
import { modules } from '@/db/schema'

export default class ModuleRepository extends BaseRepository<
  typeof modules,
  'id'
> {
  constructor() {
    super(modules, 'id');
  }
}

export const modulesRepository = new ModuleRepository();