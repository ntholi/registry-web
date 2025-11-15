import { IconChalkboard } from '@tabler/icons-react';
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
				children: [
					{
						label: 'Rooms',
						href: '/rooms',
					},
					{
						label: 'Room Types',
						href: '/room-types',
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
