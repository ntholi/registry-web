import { IconDeviceDesktopAnalytics } from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';
import FiveDaysLogo from '@/shared/ui/FiveDaysLogo';

export const lmsConfig: ModuleConfig = {
	id: 'lms',
	name: 'LMS',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: <FiveDaysLogo size='sm' />,
				description: 'Learning Management System',
				icon: IconDeviceDesktopAnalytics,
				roles: ['academic'],
				href: '/lms/courses',
				isVisible: (session) => {
					return session?.user?.position !== 'admin';
				},
			},
		],
	},

	flags: {
		enabled: moduleConfig.lms,
		beta: false,
	},
};
