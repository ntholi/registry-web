import {
	IconCalendar,
	IconChecklist,
	IconDoor,
	IconNote,
	IconTags,
} from '@tabler/icons-react';
import type { NavItem } from '../types';

export const resourceNav: NavItem[] = [
	{
		label: 'Timetable',
		icon: IconCalendar,
		collapsed: false,
		children: [
			{
				label: 'Venues',
				icon: IconDoor,
				href: '/timetable/venues',
				permissions: [{ resource: 'venues', action: 'read' }],
			},
			{
				label: 'Venue Types',
				icon: IconTags,
				href: '/timetable/venue-types',
				permissions: [{ resource: 'venues', action: 'read' }],
			},
		],
	},
	{
		label: 'Tasks',
		href: '/admin/tasks',
		icon: IconChecklist,
		permissions: [{ resource: 'tasks', action: 'read' }],
	},
	{
		label: 'Notes',
		description: 'Notes on Students',
		href: '/registry/student-notes',
		icon: IconNote,
		permissions: [{ resource: 'student-notes', action: 'read' }],
	},
];
