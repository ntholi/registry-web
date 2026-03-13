import { betterAuthServer } from '@/core/auth';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import AuthUserRepository from './repository';

class AuthUserService {
	constructor(private readonly repository = new AuthUserRepository()) {}

	async assignPreset(userId: string, presetId: string | null | undefined) {
		return withPermission(
			async () => {
				const currentPresetId = await this.repository.getPresetId(userId);
				const nextPresetId = presetId ?? null;

				if (currentPresetId === nextPresetId) {
					return this.repository.findById(userId);
				}

				const user = await this.repository.update(userId, {
					presetId: nextPresetId,
				});

				await betterAuthServer.api.revokeUserSessions({
					body: { userId },
				});

				return user;
			},
			{ users: ['update'] }
		);
	}
}

export const authUsersService = serviceWrapper(
	AuthUserService,
	'AuthUserService'
);
