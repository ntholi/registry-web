import { IconUsers } from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';

export const humanResourceConfig: ModuleConfig = {
	id: 'human-resource',
	name: 'Human Resource',
	version: '1.0.0',
	category: 'core',
	navigation: {
		dashboard: [
			{
				label: 'Employees',
				href: '/human-resource/employees',
				icon: IconUsers,
				roles: ['human_resource', 'admin'],
			},
		],
	},
	flags: {
		enabled: true,
		beta: false,
	},
};
