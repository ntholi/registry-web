import BaseRepository from '@/server/base/BaseRepository';
import { statementOfResultsPrints } from '@/shared/db/schema';

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
