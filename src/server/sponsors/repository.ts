import BaseRepository from '@/server/base/BaseRepository';
import { sponsors } from '@/db/schema'

export default class SponsorRepository extends BaseRepository<
  typeof sponsors,
  'id'
> {
  constructor() {
    super(sponsors, 'id');
  }
}

export const sponsorsRepository = new SponsorRepository();