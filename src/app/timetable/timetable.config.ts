import {
	IconCalendar,
	IconDoor,
	IconLayoutGrid,
	IconTags,
} from '@tabler/icons-react';
import type { Session } from 'next-auth';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';

function isVisible(session: Session | null) {
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
}

export const timetableConfig: ModuleConfig = {
	id: 'timetable',
	name: 'Timetable',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Timetables',
				icon: IconCalendar,
				href: '/timetable/viewer',
				isVisible: (session) =>
					isVisible(session) || session?.user?.role === 'registry',
			},
			{
				label: 'Allocations',
				icon: IconLayoutGrid,
				href: '/timetable/timetable-allocations',
				isVisible,
			},
			{
				label: 'Venues',
				icon: IconDoor,
				href: '/timetable/venues',
				isVisible,
			},
			{
				label: 'Venue Types',
				icon: IconTags,
				href: '/timetable/venue-types',
				isVisible,
			},
		],
	},

	flags: {
		enabled: moduleConfig.timetable,
		beta: false,
	},
};
