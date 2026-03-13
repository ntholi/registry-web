import {
	adminClient,
	customSessionClient,
	inferAdditionalFields,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import type { betterAuthServer, Session } from '@/core/auth';

const baseAuthClient = createAuthClient({
	plugins: [
		inferAdditionalFields<typeof betterAuthServer>(),
		adminClient(),
		customSessionClient<typeof betterAuthServer>(),
	],
});

type SessionHookResult = ReturnType<(typeof baseAuthClient)['useSession']>;
type TypedSessionHookResult = Omit<SessionHookResult, 'data'> & {
	data: Session | null;
};

export const authClient = baseAuthClient as Omit<
	typeof baseAuthClient,
	'useSession'
> & {
	useSession: () => TypedSessionHookResult;
};
