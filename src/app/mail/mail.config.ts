import {
	IconInbox,
	IconSend,
	IconSettings,
	IconStack2,
	IconUserCheck,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';

export const mailConfig: ModuleConfig = {
	id: 'mail',
	name: 'Mail',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Inbox',
				href: '/mail/inbox',
				icon: IconInbox,
				permissions: [{ resource: 'mails', action: 'read' }],
			},
			{
				label: 'Accounts',
				href: '/mail/accounts',
				icon: IconUserCheck,
				permissions: [{ resource: 'mails', action: 'read' }],
			},
			{
				label: 'Sent',
				href: '/mail/sent',
				icon: IconSend,
				permissions: [{ resource: 'mails', action: 'read' }],
			},
			{
				label: 'Queue',
				href: '/mail/queue',
				icon: IconStack2,
				roles: ['admin'],
				permissions: [{ resource: 'mails', action: 'read' }],
			},
			{
				label: 'Settings',
				href: '/mail/settings',
				icon: IconSettings,
				roles: ['admin'],
				permissions: [{ resource: 'mails', action: 'read' }],
			},
		],
	},

	flags: {
		enabled: moduleConfig.mail,
		beta: false,
	},
};
