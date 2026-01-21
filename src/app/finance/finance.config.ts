import {
	countApprovedGraduationClearances,
	countPendingGraduationClearances,
	countRejectedGraduationClearances,
} from '@registry/graduation/clearance';
import {
	countApprovedClearances,
	countPendingClearances,
	countRejectedClearances,
} from '@registry/registration';
import {
	IconBan,
	IconBuildingBank,
	IconCertificate,
	IconCircleCheck,
	IconClipboardCheck,
	IconHourglass,
} from '@tabler/icons-react';
import type {
	ModuleConfig,
	NavItem,
} from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';
import type { UserPosition, UserRole } from '@/core/database';

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
