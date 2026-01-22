import { IconBuildingBank } from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';

export const financeConfig: ModuleConfig = {
	id: 'finance',
	name: 'Finance',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Sponsors',
				href: '/finance/sponsors',
				icon: IconBuildingBank,
				roles: ['admin', 'finance'],
			},
		],
	},

	flags: {
		enabled: moduleConfig.finance,
		beta: false,
	},
};
