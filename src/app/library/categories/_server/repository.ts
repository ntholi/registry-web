import { categories } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class CategoryRepository extends BaseRepository<
	typeof categories,
	'id'
> {
	constructor() {
		super(categories, categories.id);
	}
}
