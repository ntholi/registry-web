import type { ActivityFragment } from '@/shared/lib/utils/activities';

const TIMETABLE_ACTIVITIES = {
	catalog: {
		venue_created: { label: 'Venue Created', department: 'resource' },
		venue_updated: { label: 'Venue Updated', department: 'resource' },
		venue_deleted: { label: 'Venue Deleted', department: 'resource' },
		venue_type_created: {
			label: 'Venue Type Created',
			department: 'resource',
		},
		venue_type_updated: {
			label: 'Venue Type Updated',
			department: 'resource',
		},
		venue_type_deleted: {
			label: 'Venue Type Deleted',
			department: 'resource',
		},
		allocation_created: {
			label: 'Allocation Created',
			department: 'resource',
		},
		allocation_updated: {
			label: 'Allocation Updated',
			department: 'resource',
		},
		allocation_deleted: {
			label: 'Allocation Deleted',
			department: 'resource',
		},
		slot_created: { label: 'Slot Created', department: 'resource' },
		slot_updated: { label: 'Slot Updated', department: 'resource' },
		slot_deleted: { label: 'Slot Deleted', department: 'resource' },
	},
	tableOperationMap: {
		'venues:INSERT': 'venue_created',
		'venues:UPDATE': 'venue_updated',
		'venues:DELETE': 'venue_deleted',
		'venue_types:INSERT': 'venue_type_created',
		'venue_types:UPDATE': 'venue_type_updated',
		'venue_types:DELETE': 'venue_type_deleted',
		'timetable_allocations:INSERT': 'allocation_created',
		'timetable_allocations:UPDATE': 'allocation_updated',
		'timetable_allocations:DELETE': 'allocation_deleted',
		'timetable_slots:INSERT': 'slot_created',
		'timetable_slots:UPDATE': 'slot_updated',
		'timetable_slots:DELETE': 'slot_deleted',
	},
} as const satisfies ActivityFragment;

export default TIMETABLE_ACTIVITIES;

export type TimetableActivityType = keyof typeof TIMETABLE_ACTIVITIES.catalog;
