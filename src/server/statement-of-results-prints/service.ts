import { db } from '@/db';
import { statementOfResultsPrints } from '@/db/schema';
import StatementOfResultsPrintsRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { serviceWrapper } from '@/server/base/serviceWrapper';
import { eq } from 'drizzle-orm';

type StatementOfResultsPrint = typeof statementOfResultsPrints.$inferInsert;

class StatementOfResultsPrintsService {
  constructor(
    private readonly repository = new StatementOfResultsPrintsRepository(),
  ) {}

  async create(data: StatementOfResultsPrint) {
    console.log('\n\n\n\n\n\nCreating Statement of Results Print:', data);
    return withAuth(async () => this.repository.create(data), ['dashboard']);
  }

  async findAll(params: QueryOptions<typeof statementOfResultsPrints>) {
    return withAuth(async () => this.repository.query(params), ['dashboard']);
  }

  async get(id: string) {
    return withAuth(async () => this.repository.findById(id), ['dashboard']);
  }

  async findByStudent(stdNo: number) {
    return withAuth(
      async () =>
        db.query.statementOfResultsPrints.findMany({
          where: eq(statementOfResultsPrints.stdNo, stdNo),
          orderBy: (table, { desc }) => [desc(table.printedAt)],
        }),
      ['dashboard'],
    );
  }

  async count() {
    return withAuth(async () => this.repository.count(), ['dashboard']);
  }
}

export const statementOfResultsPrintsService = serviceWrapper(
  StatementOfResultsPrintsService,
  'StatementOfResultsPrintsService',
);
