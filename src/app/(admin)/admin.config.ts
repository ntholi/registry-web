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

export const adminConfig: ModuleConfig = {
	id: 'admin-management',
	name: 'Admin Management',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Users',
				href: '/users',
				icon: IconUserCog,
				roles: ['admin'],
			},
			{
				label: 'Tasks',
				href: '/tasks',
				icon: IconCalendarStats,
				roles: ['admin'],
			},
			{
				label: 'Modules',
				href: '/modules',
				icon: IconBookmark,
				roles: ['admin'],
			},
			{
				label: 'Semester Modules',
				href: '/semester-modules',
				icon: IconBookmarks,
				roles: ['admin'],
			},
			{
				label: 'Terms',
				href: '/terms',
				icon: IconCalendarEvent,
				roles: ['admin'],
			},
			{
				label: 'Sponsors',
				href: '/sponsors',
				icon: IconBuildingBank,
				roles: ['admin', 'finance'],
			},
			{
				label: 'Sponsored Students',
				href: '/sponsored-students',
				icon: IconUsersGroup,
				roles: ['admin', 'finance', 'registry'],
			},
			{
				label: 'Schools',
				href: '/schools',
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
						href: '/tools/simulate',
						icon: IconTestPipe,
					},
					{
						label: 'Grade Calculator',
						href: '/tools/grade-calculator',
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
						href: '/bulk/transcripts',
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
		enabled: true,
		beta: false,
	},
};
