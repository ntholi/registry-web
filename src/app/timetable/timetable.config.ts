import {
	IconCalendar,
	IconDoor,
	IconLayoutGrid,
	IconTags,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';
import type { Session } from '@/core/auth';
import {
	hasAnyPermission,
	hasSessionPermission,
} from '@/core/auth/sessionPermissions';

function isVisible(session: Session | null) {
	return hasAnyPermission(session, 'timetable', ['create', 'update', 'delete']);
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
					hasSessionPermission(session, 'timetable', 'read', ['registry']),
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
				isVisible: (session) => hasSessionPermission(session, 'venues', 'read'),
			},
			{
				label: 'Venue Types',
				icon: IconTags,
				href: '/timetable/venue-types',
				isVisible: (session) => hasSessionPermission(session, 'venues', 'read'),
			},
		],
	},

	flags: {
		enabled: moduleConfig.timetable,
		beta: false,
	},
};
