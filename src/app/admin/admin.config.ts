import { countUncompletedTasks } from '@admin/tasks';
import {
	IconActivity,
	IconBell,
	IconCalculator,
	IconChecklist,
	IconFileExport,
	IconFlask,
	IconInbox,
	IconMail,
	IconPackage,
	IconSearch,
	IconSend,
	IconSettings,
	IconShield,
	IconStack2,
	IconUserCheck,
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
				label: 'Permission Presets',
				href: '/admin/permission-presets',
				icon: IconShield,
				roles: ['admin'],
				permissions: [{ resource: 'permission-presets', action: 'read' }],
			},
			{
				label: 'Notifications',
				href: '/admin/notifications',
				icon: IconBell,
				roles: ['admin'],
			},
			{
				label: 'Mail',
				href: '/admin/mail',
				icon: IconMail,
				collapsed: true,
				permissions: [{ resource: 'mails', action: 'read' }],
				children: [
					{ label: 'Inbox', href: '/admin/mail/inbox', icon: IconInbox },
					{
						label: 'Accounts',
						href: '/admin/mail/accounts',
						icon: IconUserCheck,
					},
					{ label: 'Sent', href: '/admin/mail/sent', icon: IconSend },
					{
						label: 'Queue',
						href: '/admin/mail/queue',
						icon: IconStack2,
						roles: ['admin'],
					},
					{
						label: 'Settings',
						href: '/admin/mail/settings',
						icon: IconSettings,
						roles: ['admin'],
					},
				] as NavItem[],
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
				permissions: [{ resource: 'activity-tracker', action: 'read' }],
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
