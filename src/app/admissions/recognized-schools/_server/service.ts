import { hasApplicantResourceAccess } from '@/core/auth/sessionPermissions';
import type { recognizedSchools } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import RecognizedSchoolRepository from './repository';

function canReadRecognizedSchools(
	session: Parameters<typeof hasApplicantResourceAccess>[0]
) {
	return hasApplicantResourceAccess(session, 'recognized-schools', 'read');
}

class RecognizedSchoolService extends BaseService<
	typeof recognizedSchools,
	'id'
> {
	private repo: RecognizedSchoolRepository;

	constructor() {
		const repo = new RecognizedSchoolRepository();
		super(repo, {
			byIdAuth: { 'recognized-schools': ['read'] },
			findAllAuth: { 'recognized-schools': ['read'] },
			createAuth: { 'recognized-schools': ['create'] },
			updateAuth: { 'recognized-schools': ['update'] },
			deleteAuth: { 'recognized-schools': ['delete'] },
			activityTypes: {
				create: 'recognized_school_added',
				update: 'recognized_school_updated',
				delete: 'recognized_school_deleted',
			},
		});
		this.repo = repo;
	}

	async findAllForEligibility() {
		return withPermission(
			async () => this.repo.findAllActive(),
			async (session) => canReadRecognizedSchools(session)
		);
	}
}

export const recognizedSchoolsService = serviceWrapper(
	RecognizedSchoolService,
	'RecognizedSchoolService'
);
