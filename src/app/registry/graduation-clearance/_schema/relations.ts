import { clearance } from '@registry/clearance/_schema/clearance';
import { graduationRequests } from '@registry/graduation-requests/_schema/graduationRequests';
import { relations } from 'drizzle-orm';
import { graduationClearance } from './graduationClearance';

export const graduationClearanceRelations = relations(
	graduationClearance,
	({ one }) => ({
		graduationRequest: one(graduationRequests, {
			fields: [graduationClearance.graduationRequestId],
			references: [graduationRequests.id],
		}),
		clearance: one(clearance, {
			fields: [graduationClearance.clearanceId],
			references: [clearance.id],
		}),
	})
);
