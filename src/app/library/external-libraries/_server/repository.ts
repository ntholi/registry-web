import { externalLibraries } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class ExternalLibraryRepository extends BaseRepository<
	typeof externalLibraries,
	'id'
> {
	constructor() {
		super(externalLibraries, externalLibraries.id);
	}
}
