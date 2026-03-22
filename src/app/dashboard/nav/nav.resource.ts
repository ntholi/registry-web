import {
	IconCalendar,
	IconChecklist,
	IconDoor,
	IconInbox,
	IconMail,
	IconSend,
	IconTags,
	IconUserCheck,
	IconUserPlus,
} from '@tabler/icons-react';
import type { NavItem } from '../types';

export const resourceNav: NavItem[] = [
	{
		label: 'Timetable',
		icon: IconCalendar,
		collapsed: false,
		children: [
			{
				label: 'Timetables',
				icon: IconCalendar,
				href: '/timetable/viewer',
				permissions: [{ resource: 'timetable', action: 'read' }],
			},
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
		label: 'Registration',
		href: '/registry/registration/requests',
		icon: IconUserPlus,
		permissions: [{ resource: 'registration', action: 'read' }],
	},
	{
		label: 'Tasks',
		href: '/admin/tasks',
		icon: IconChecklist,
		permissions: [{ resource: 'tasks', action: 'read' }],
	},
	{
		label: 'Mail',
		icon: IconMail,
		collapsed: true,
		children: [
			{
				label: 'Inbox',
				href: '/mail/inbox',
				icon: IconInbox,
				permissions: [{ resource: 'mails', action: 'read' }],
			},
			{
				label: 'Accounts',
				href: '/mail/accounts',
				icon: IconUserCheck,
				permissions: [{ resource: 'mails', action: 'read' }],
			},
			{
				label: 'Sent',
				href: '/mail/sent',
				icon: IconSend,
				permissions: [{ resource: 'mails', action: 'read' }],
			},
		],
	},
];
