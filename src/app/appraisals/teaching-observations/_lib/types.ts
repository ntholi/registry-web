import { z } from 'zod/v4';

export const observationFormSchema = z.object({
	cycleId: z.string().min(1),
	assignedModuleId: z.number().int().positive(),
	strengths: z.string().nullable(),
	improvements: z.string().nullable(),
	recommendations: z.string().nullable(),
	trainingArea: z.string().nullable(),
	ratings: z.array(
		z.object({
			criterionId: z.string().min(1),
			rating: z.number().int().min(1).max(5).nullable(),
		})
	),
});

export const submitValidation = z.object({
	ratings: z.array(
		z.object({
			criterionId: z.string().min(1),
			rating: z.number().int().min(1).max(5),
		})
	),
	strengths: z.string().min(1),
	improvements: z.string().min(1),
});

export const acknowledgeSchema = z.object({
	comment: z.string().nullable(),
});

export type ObservationFormValues = z.infer<typeof observationFormSchema>;
