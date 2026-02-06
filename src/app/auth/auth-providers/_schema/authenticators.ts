import {
	boolean,
	integer,
	pgTable,
	primaryKey,
	text,
} from 'drizzle-orm/pg-core';
import { users } from '../../users/_schema/users';

export const authenticators = pgTable(
	'authenticators',
	{
		credentialID: text().notNull().unique(),
		userId: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		providerAccountId: text().notNull(),
		credentialPublicKey: text().notNull(),
		counter: integer().notNull(),
		credentialDeviceType: text().notNull(),
		credentialBackedUp: boolean().notNull(),
		transports: text(),
	},
	(authenticator) => ({
		compositePK: primaryKey({
			columns: [authenticator.userId, authenticator.credentialID],
		}),
	})
);
