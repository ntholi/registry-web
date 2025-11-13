'use server';

import type { statementOfResultsPrints } from '@/core/db/schema';
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

export async function findAllStatementOfResultsPrints(
	page: number = 1,
	search = ''
) {
	return service.findAll({ page, search });
}

export async function findStatementOfResultsPrintsByStudent(stdNo: number) {
	return service.findByStudent(stdNo);
}
