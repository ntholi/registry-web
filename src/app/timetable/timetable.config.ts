import {
	IconCalendar,
	IconCalendarTime,
	IconDoor,
	IconLayoutGrid,
	IconTags,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';

export const timetableConfig: ModuleConfig = {
	id: 'timetable',
	name: 'Timetable',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Timetable',
				icon: IconCalendarTime,
				collapsed: true,
				children: [
					{
						label: 'Timetables',
						icon: IconCalendar,
						href: '/timetable/viewer',
					},
					{
						label: 'Allocations',
						icon: IconLayoutGrid,
						href: '/timetable/timetable-allocations',
					},
					{
						label: 'Venues',
						icon: IconDoor,
						href: '/timetable/venues',
					},
					{
						label: 'Venue Types',
						icon: IconTags,
						href: '/timetable/venue-types',
					},
				],
				isVisible: (session) => {
					if (session?.user?.role === 'admin') {
						return true;
					}
					if (
						session?.user?.role === 'academic' &&
						['manager', 'admin', 'program_leader'].includes(
							session?.user?.position || ''
						)
					)
						return true;
					return false;
				},
			},
		],
	},

	flags: {
		enabled: moduleConfig.timetable,
		beta: false,
	},
};
