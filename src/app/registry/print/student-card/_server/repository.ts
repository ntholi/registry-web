import { studentCardPrints } from '@/core/database';
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
