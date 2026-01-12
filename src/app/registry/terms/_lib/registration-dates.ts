import { z } from 'zod';

const isoDateSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD');

export const registrationDatesSchema = z
	.object({
		startDate: isoDateSchema.nullable(),
		endDate: isoDateSchema.nullable(),
	})
	.superRefine((v, ctx) => {
		if (v.startDate === null && v.endDate === null) return;
		if (v.startDate === null || v.endDate === null) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Start and end dates are required',
			});
			return;
		}
		if (v.startDate > v.endDate) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Start date must be before end date',
			});
		}
	});
