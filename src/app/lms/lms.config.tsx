import { Text } from '@mantine/core';
import { IconDeviceDesktopAnalytics } from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';

export const lmsConfig: ModuleConfig = {
	id: 'lms',
	name: 'LMS',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: (
					<Text>
						<Text component='span' size='sm' c='blue'>
							Five
						</Text>
						<Text component='span' size='sm'>
							Days
						</Text>
					</Text>
				),
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
