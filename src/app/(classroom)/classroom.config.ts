import { IconChalkboard } from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';

export const classroomConfig: ModuleConfig = {
	id: 'classroom-management',
	name: 'Classroom Management',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Classroom',
				icon: IconChalkboard,
				roles: ['academic'],
				href: '/courses',
				isVisible: (session) => {
					return session?.user?.position !== 'admin';
				},
			},
		],
	},

	flags: {
		enabled: true,
		beta: false,
	},
};
