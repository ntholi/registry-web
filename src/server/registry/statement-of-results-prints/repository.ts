import { statementOfResultsPrints } from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';

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
