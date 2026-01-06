'use server';

import type { statementOfResultsPrints } from '@/core/database';
import { statementOfResultsPrintsService as service } from './service';

type StatementOfResultsPrint = typeof statementOfResultsPrints.$inferInsert;

export async function createStatementOfResultsPrint(
	data: StatementOfResultsPrint
) {
	return service.create(data);
}

export async function getStatementOfResultsPrint(id: string) {
	return service.get(id);
}
