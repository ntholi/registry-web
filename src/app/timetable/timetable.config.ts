import {
	IconCalendar,
	IconDoor,
	IconLayoutGrid,
	IconTags,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';
import type { Session } from '@/core/auth';
import { hasAnyPermission } from '@/core/auth/sessionPermissions';

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
				permissions: [{ resource: 'timetable', action: 'read' }],
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

	flags: {
		enabled: moduleConfig.timetable,
		beta: false,
	},
};
