import { studentCardPrints } from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';

export default class StudentCardPrintRepository extends BaseRepository<
	typeof studentCardPrints,
	'id'
> {
	constructor() {
		super(studentCardPrints, studentCardPrints.id);
	}
}

export const studentCardPrintsRepository = new StudentCardPrintRepository();
