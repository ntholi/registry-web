import { statementOfResultsPrints } from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';

export default class StatementOfResultsPrintsRepository extends BaseRepository<
  typeof statementOfResultsPrints,
  'id'
> {
  constructor() {
    super(statementOfResultsPrints, 'id');
  }
}

export const statementOfResultsPrintsRepository =
  new StatementOfResultsPrintsRepository();
