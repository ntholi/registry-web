import type { User as DefaultUser } from 'next-auth';
import type { UserPosition, UserRole } from '@/db/schema';

declare module 'next-auth' {
	interface User extends DefaultUser {
		role: UserRole;
		stdNo?: number;
		position?: UserPosition;
		lmsUserId?: number;
	}

	interface Session {
		accessToken?: string;
	}
}
