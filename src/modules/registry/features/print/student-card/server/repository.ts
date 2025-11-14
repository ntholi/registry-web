import { studentCardPrints } from '@/core/database/schema';
import BaseRepository from '@/core/platform/BaseRepository';

export default class StudentCardPrintRepository extends BaseRepository<
	typeof studentCardPrints,
	'id'
> {
	constructor() {
		super(studentCardPrints, studentCardPrints.id);
	}
}

export const studentCardPrintsRepository = new StudentCardPrintRepository();
