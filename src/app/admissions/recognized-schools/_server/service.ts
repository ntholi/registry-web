import type { recognizedSchools } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import RecognizedSchoolRepository from './repository';

class RecognizedSchoolService extends BaseService<
	typeof recognizedSchools,
	'id'
> {
	private repo: RecognizedSchoolRepository;

	constructor() {
		const repo = new RecognizedSchoolRepository();
		super(repo, {
			byIdRoles: ['registry', 'marketing', 'admin'],
			findAllRoles: ['registry', 'marketing', 'admin'],
			createRoles: ['registry', 'marketing', 'admin'],
			updateRoles: ['registry', 'marketing', 'admin'],
			deleteRoles: ['registry', 'marketing', 'admin'],
		});
		this.repo = repo;
	}

	async findAllForEligibility() {
		return withAuth(
			async () => this.repo.findAllActive(),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}
}

export const recognizedSchoolsService = serviceWrapper(
	RecognizedSchoolService,
	'RecognizedSchoolService'
);
