'use server';

import type { statementOfResultsPrints } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { statementOfResultsPrintsService as service } from './service';

type StatementOfResultsPrint = typeof statementOfResultsPrints.$inferInsert;

export const createStatementOfResultsPrint = createAction(
	async (data: StatementOfResultsPrint) => {
		return service.create(data);
	}
);

export const getStatementOfResultsPrint = createAction(async (id: string) => {
	return service.get(id);
});
