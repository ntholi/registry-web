import { authors } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class AuthorRepository extends BaseRepository<
	typeof authors,
	'id'
> {
	constructor() {
		super(authors, authors.id);
	}
}
