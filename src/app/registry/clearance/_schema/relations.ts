import { users } from '@auth/users/_schema/users';
import { graduationClearance } from '@registry/graduation/clearance/_schema/graduationClearance';
import { registrationRequests } from '@registry/registration-requests/_schema/registrationRequests';
import { relations } from 'drizzle-orm';
import { clearance } from './clearance';
import { registrationClearance } from './registrationClearance';

export const clearanceRelations = relations(clearance, ({ one, many }) => ({
	respondedBy: one(users, {
		fields: [clearance.respondedBy],
		references: [users.id],
	}),
	registrationClearances: many(registrationClearance),
	graduationClearances: many(graduationClearance),
}));

export const registrationClearanceRelations = relations(
	registrationClearance,
	({ one }) => ({
		registrationRequest: one(registrationRequests, {
			fields: [registrationClearance.registrationRequestId],
			references: [registrationRequests.id],
		}),
		clearance: one(clearance, {
			fields: [registrationClearance.clearanceId],
			references: [clearance.id],
		}),
	})
);
