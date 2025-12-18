import {
	IconBell,
	IconBook,
	IconBooks,
	IconBuildingBank,
	IconCalculator,
	IconCalendarMonth,
	IconChartBar,
	IconFileExport,
	IconFlask,
	IconPackage,
	IconSchool,
	IconSettings,
	IconSubtask,
	IconUserShield,
	IconUsersPlus,
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
				label: 'Tasks',
				href: '/admin/tasks',
				icon: IconSubtask,
				roles: ['admin'],
			},
			{
				label: 'Modules',
				href: '/academic/modules',
				icon: IconBook,
				roles: ['admin'],
			},
			{
				label: 'Semester Modules',
				href: '/academic/semester-modules',
				icon: IconBooks,
				roles: ['admin'],
			},
			{
				label: 'Terms',
				href: '/registry/terms',
				icon: IconCalendarMonth,
				roles: ['admin'],
			},
			{
				label: 'Sponsors',
				href: '/finance/sponsors',
				icon: IconBuildingBank,
				roles: ['admin', 'finance'],
			},
			{
				label: 'Sponsored Students',
				href: '/finance/sponsored-students',
				icon: IconUsersPlus,
				roles: ['admin', 'finance', 'registry'],
			},
			{
				label: 'Schools',
				href: '/academic/schools',
				icon: IconSchool,
				roles: ['registry', 'admin', 'academic', 'finance', 'student_services'],
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
			{
				label: 'Reports',
				icon: IconChartBar,
				children: [] as NavItem[],
			},
		],
	},

	flags: {
		enabled: moduleConfig.admin,
		beta: false,
	},
};
