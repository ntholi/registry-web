import { countUncompletedTasks } from '@admin/tasks';
import {
	IconActivity,
	IconBell,
	IconCalculator,
	IconChecklist,
	IconFileExport,
	IconFlask,
	IconPackage,
	IconSearch,
	IconSettings,
	IconUserShield,
} from '@tabler/icons-react';
import type {
	ModuleConfig,
	NavItem,
} from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';

export const adminConfig: ModuleConfig = {
	id: 'admin',
	name: 'Admin',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Tasks',
				href: '/admin/tasks',
				icon: IconChecklist,
				roles: ['admin', 'registry', 'finance'],
				notificationCount: {
					queryKey: ['tasks', 'uncompleted'],
					queryFn: () => countUncompletedTasks(),
					color: 'red',
				},
			},
			{
				label: 'Users',
				href: '/admin/users',
				icon: IconUserShield,
				roles: ['admin'],
			},
			{
				label: 'Notifications',
				href: '/admin/notifications',
				icon: IconBell,
				roles: ['admin'],
			},
			{
				label: 'Activity Tracker',
				href: '/admin/activity-tracker',
				icon: IconActivity,
				roles: [
					'admin',
					'registry',
					'finance',
					'library',
					'resource',
					'academic',
					'marketing',
					'student_services',
				],
				isVisible: (session) =>
					session?.user?.position === 'manager' ||
					session?.user?.role === 'admin',
			},
			{
				label: 'Tools',
				icon: IconSettings,
				collapsed: true,
				roles: ['registry', 'academic', 'admin', 'student_services'],
				children: [
					{
						label: 'Simulator',
						href: '/admin/tools/simulate',
						icon: IconFlask,
					},
					{
						label: 'Grade Calculator',
						href: '/admin/tools/grade-calculator',
						icon: IconCalculator,
					},
					{
						label: 'Grade Finder',
						href: '/admin/tools/grade-finder',
						icon: IconSearch,
					},
				] as NavItem[],
			},
			{
				label: 'Bulk',
				icon: IconPackage,
				roles: ['admin', 'registry'],
				children: [
					{
						label: 'Export Transcript',
						href: '/admin/bulk/transcripts',
						icon: IconFileExport,
					},
				] as NavItem[],
			},
		],
	},

	flags: {
		enabled: moduleConfig.admin,
		beta: false,
	},
};
