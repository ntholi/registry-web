import { statementOfResultsPrints } from '@/core/database/schema';
import BaseRepository from '@/core/platform/BaseRepository';

export default class StatementOfResultsPrintRepository extends BaseRepository<
	typeof statementOfResultsPrints,
	'id'
> {
	constructor() {
		super(statementOfResultsPrints, statementOfResultsPrints.id);
	}
}

export const statementOfResultsPrintsRepository =
	new StatementOfResultsPrintRepository();
