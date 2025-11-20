import {
	IconBuilding,
	IconCalendarEvent,
	IconCategory,
	IconChalkboard,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';

export const timetableConfig: ModuleConfig = {
	id: 'timetable',
	name: 'Timetable',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Timetable',
				icon: IconChalkboard,
				collapsed: true,
				children: [
					{
						label: 'Allocations',
						icon: IconCalendarEvent,
						href: '/timetable-allocations',
					},
					{
						label: 'Venues',
						icon: IconBuilding,
						href: '/venues',
					},
					{
						label: 'Venue Types',
						icon: IconCategory,
						href: '/venue-types',
					},
				],
				roles: ['academic'],
				isVisible: (session) => {
					return ['manager', 'admin', 'program_leader'].includes(
						session?.user?.position || ''
					);
				},
			},
		],
	},

	flags: {
		enabled: true,
		beta: false,
	},
};
