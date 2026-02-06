import { type ZodType, z } from 'zod';
import { parseTimeToMinutes } from '@/shared/lib/utils/dates';

export const daysOfWeek = [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday',
] as const;

export type DayOfWeek = (typeof daysOfWeek)[number];

export const MIN_START_TIME = 240;
export const MAX_END_TIME = 1380;
export const MIN_DURATION = 5;
export const MAX_DURATION = 720;

type TimeFields = { startTime: string; endTime: string };

export function applyTimeRefinements<T extends TimeFields>(
	schema: ZodType<T>
): ZodType<T> {
	return schema
		.refine(
			(data) => {
				const startMinutes = parseTimeToMinutes(data.startTime);
				return startMinutes >= MIN_START_TIME && startMinutes <= MAX_END_TIME;
			},
			{
				message: 'Start time must be between 04:00 and 23:00',
				path: ['startTime'],
			}
		)
		.refine(
			(data) => {
				const endMinutes = parseTimeToMinutes(data.endTime);
				return endMinutes >= MIN_START_TIME && endMinutes <= MAX_END_TIME;
			},
			{
				message: 'End time must be between 04:00 and 23:00',
				path: ['endTime'],
			}
		)
		.refine(
			(data) => {
				const startMinutes = parseTimeToMinutes(data.startTime);
				const endMinutes = parseTimeToMinutes(data.endTime);
				return endMinutes > startMinutes;
			},
			{
				message: 'End time must be after start time',
				path: ['endTime'],
			}
			// biome-ignore lint/suspicious/noExplicitAny: Zod 4 refinement chain returns any
		) as any;
}

export const baseAllocationSchemaInner = z.object({
	duration: z
		.number()
		.min(MIN_DURATION, 'Duration must be at least 5 minutes')
		.max(MAX_DURATION, 'Duration cannot exceed 12 hours'),
	classType: z.enum(['lecture', 'tutorial', 'lab', 'workshop', 'practical']),
	numberOfStudents: z.number().min(1, 'A class should have at least 1 student'),
	venueTypeIds: z.array(z.string()),
	allowedDays: z
		.array(z.enum(daysOfWeek))
		.min(1, 'Please select at least one day'),
	startTime: z.string().min(1, 'Please enter a start time'),
	endTime: z.string().min(1, 'Please enter an end time'),
	allowedVenueIds: z.array(z.string()),
});

export const baseAllocationSchema = applyTimeRefinements(
	baseAllocationSchemaInner
);

export type BaseAllocationFormValues = z.infer<typeof baseAllocationSchema>;

export const classTypes = [
	{ value: 'lecture', label: 'Lecture' },
	{ value: 'tutorial', label: 'Tutorial' },
	{ value: 'lab', label: 'Lab' },
	{ value: 'workshop', label: 'Workshop' },
	{ value: 'practical', label: 'Practical' },
] as const;

const groupSlotSchemaInner = z.object({
	dayOfWeek: z.enum(daysOfWeek),
	startTime: z.string().min(1, 'Please enter a start time'),
	endTime: z.string().min(1, 'Please enter an end time'),
	venueId: z.string().min(1, 'Please select a venue'),
	allowOverflow: z.boolean().default(false),
});

export const groupSlotSchema = applyTimeRefinements(
	groupSlotSchemaInner
).refine(
	(data) => {
		const startMinutes = parseTimeToMinutes(data.startTime);
		const endMinutes = parseTimeToMinutes(data.endTime);
		const duration = endMinutes - startMinutes;
		return duration >= MIN_DURATION && duration <= MAX_DURATION;
	},
	{
		message: 'Class duration must be between 5 minutes and 12 hours',
		path: ['endTime'],
	}
);

export type GroupSlot = z.infer<typeof groupSlotSchema>;
