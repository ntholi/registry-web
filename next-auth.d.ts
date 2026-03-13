import type { User as DefaultUser } from 'next-auth';
import type { UserPosition, UserRole } from '@/db/schema';

declare module 'next-auth' {
	interface User extends DefaultUser {
		role: UserRole;
		presetId?: string | null;
		stdNo?: number;
		position?: UserPosition;
	}

	interface Session {
		accessToken?: string;
	}
}
