import { graduationLists } from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';

export default class GraduationListRepository extends BaseRepository<typeof graduationLists, 'id'> {
	constructor() {
		super(graduationLists, graduationLists.id);
	}
}

export const graduationListsRepository = new GraduationListRepository();
