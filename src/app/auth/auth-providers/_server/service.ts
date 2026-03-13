import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { getLmsCredentials, upsertLmsCredentials } from './repository';

class AuthProviderService {
	async getLmsCredentials(userId: string) {
		return getLmsCredentials(userId);
	}

	async syncLmsCredentials(
		userId: string,
		lmsUserId: number | null | undefined,
		lmsToken: string | null | undefined
	) {
		return upsertLmsCredentials(userId, lmsUserId, lmsToken);
	}
}

export const authProviderService = serviceWrapper(
	AuthProviderService,
	'AuthProviderService'
);
