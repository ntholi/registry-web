import { assignedModules } from '@academic/assigned-modules/_schema/assignedModules';
import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { feedbackCycles } from '../../cycles/_schema/feedbackCycles';
import { observationCategories } from './observationCategories';
import { observationCriteria } from './observationCriteria';
import { observationRatings } from './observationRatings';
import { observations } from './observations';

export const observationCategoriesRelations = relations(
	observationCategories,
	({ many }) => ({
		criteria: many(observationCriteria),
	})
);

export const observationCriteriaRelations = relations(
	observationCriteria,
	({ one, many }) => ({
		category: one(observationCategories, {
			fields: [observationCriteria.categoryId],
			references: [observationCategories.id],
		}),
		ratings: many(observationRatings),
	})
);

export const observationsRelations = relations(
	observations,
	({ one, many }) => ({
		cycle: one(feedbackCycles, {
			fields: [observations.cycleId],
			references: [feedbackCycles.id],
		}),
		assignedModule: one(assignedModules, {
			fields: [observations.assignedModuleId],
			references: [assignedModules.id],
		}),
		observer: one(users, {
			fields: [observations.observerId],
			references: [users.id],
		}),
		ratings: many(observationRatings),
	})
);

export const observationRatingsRelations = relations(
	observationRatings,
	({ one }) => ({
		observation: one(observations, {
			fields: [observationRatings.observationId],
			references: [observations.id],
		}),
		criterion: one(observationCriteria, {
			fields: [observationRatings.criterionId],
			references: [observationCriteria.id],
		}),
	})
);
