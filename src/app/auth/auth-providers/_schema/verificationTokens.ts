import { pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

export const verificationTokens = pgTable(
	'verification_tokens',
	{
		identifier: text().notNull(),
		token: text().notNull(),
		expires: timestamp({ mode: 'date' }).notNull(),
	},
	(verificationToken) => ({
		compositePk: primaryKey({
			columns: [verificationToken.identifier, verificationToken.token],
		}),
	})
);
