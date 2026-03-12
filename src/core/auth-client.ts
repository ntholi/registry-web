import {
	adminClient,
	customSessionClient,
	inferAdditionalFields,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import type { betterAuthServer } from '@/core/auth';

export const authClient = createAuthClient({
	plugins: [
		inferAdditionalFields<typeof betterAuthServer>(),
		adminClient(),
		customSessionClient<typeof betterAuthServer>(),
	],
});
