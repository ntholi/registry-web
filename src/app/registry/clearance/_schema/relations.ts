import { relations } from 'drizzle-orm';
import {
	graduationClearance,
	registrationRequests,
	users,
} from '@/core/database';
import { clearance } from './clearance';
import { clearanceAudit } from './clearanceAudit';
import { registrationClearance } from './registrationClearance';

export const clearanceRelations = relations(clearance, ({ one, many }) => ({
	respondedBy: one(users, {
		fields: [clearance.respondedBy],
		references: [users.id],
	}),
	audits: many(clearanceAudit),
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

export const clearanceAuditRelations = relations(clearanceAudit, ({ one }) => ({
	clearance: one(clearance, {
		fields: [clearanceAudit.clearanceId],
		references: [clearance.id],
	}),
	user: one(users, {
		fields: [clearanceAudit.createdBy],
		references: [users.id],
	}),
}));
