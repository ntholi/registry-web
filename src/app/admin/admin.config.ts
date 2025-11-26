import {
	IconBookmark,
	IconBookmarks,
	IconBuildingBank,
	IconBuildingStore,
	IconCalculator,
	IconCalendarEvent,
	IconCalendarStats,
	IconChartLine,
	IconFileDownload,
	IconPackages,
	IconTestPipe,
	IconTool,
	IconUserCog,
	IconUsersGroup,
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
				icon: IconUserCog,
				roles: ['admin'],
			},
			{
				label: 'Tasks',
				href: '/admin/tasks',
				icon: IconCalendarStats,
				roles: ['admin'],
			},
			{
				label: 'Modules',
				href: '/academic/modules',
				icon: IconBookmark,
				roles: ['admin'],
			},
			{
				label: 'Semester Modules',
				href: '/academic/semester-modules',
				icon: IconBookmarks,
				roles: ['admin'],
			},
			{
				label: 'Terms',
				href: '/registry/terms',
				icon: IconCalendarEvent,
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
				icon: IconUsersGroup,
				roles: ['admin', 'finance', 'registry'],
			},
			{
				label: 'Schools',
				href: '/academic/schools',
				icon: IconBuildingStore,
				roles: ['registry', 'admin', 'academic', 'finance', 'student_services'],
			},
			{
				label: 'Tools',
				icon: IconTool,
				roles: ['registry', 'academic', 'admin', 'student_services'],
				children: [
					{
						label: 'Simulator',
						href: '/admin/tools/simulate',
						icon: IconTestPipe,
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
				icon: IconPackages,
				roles: ['admin', 'registry'],
				children: [
					{
						label: 'Export Transcript',
						href: '/admin/bulk/transcripts',
						icon: IconFileDownload,
					},
				] as NavItem[],
			},
			{
				label: 'Reports',
				icon: IconChartLine,
				children: [] as NavItem[],
			},
		],
	},

	flags: {
		enabled: moduleConfig.admin,
		beta: false,
	},
};
