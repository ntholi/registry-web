import {
	IconBook2,
	IconBooks,
	IconCash,
	IconCategory,
	IconChecklist,
	IconFileText,
	IconInbox,
	IconLibrary,
	IconMail,
	IconSend,
	IconSettings,
	IconTags,
	IconUserCheck,
	IconUserPlus,
	IconUsers,
	IconWriting,
} from '@tabler/icons-react';
import type { NavItem } from '../types';

export const libraryNav: NavItem[] = [
	{
		label: 'Catalog',
		href: '/library/catalog',
		icon: IconBooks,
		permissions: [{ resource: 'library', action: 'read' }],
	},
	{
		label: 'Books',
		href: '/library/books',
		icon: IconBook2,
		permissions: [{ resource: 'library', action: 'read' }],
	},
	{
		label: 'Loans',
		href: '/library/loans',
		icon: IconLibrary,
		permissions: [{ resource: 'library', action: 'read' }],
	},
	{
		label: 'Authors',
		href: '/library/authors',
		icon: IconUsers,
		permissions: [{ resource: 'library', action: 'read' }],
	},
	{
		label: 'Categories',
		href: '/library/categories',
		icon: IconCategory,
		permissions: [{ resource: 'library', action: 'read' }],
	},
	{
		label: 'Fines',
		href: '/library/fines',
		icon: IconCash,
		permissions: [{ resource: 'library', action: 'read' }],
	},
	{
		label: 'Resources',
		icon: IconTags,
		collapsed: true,
		permissions: [{ resource: 'library', action: 'read' }],
		children: [
			{
				label: 'Publications',
				href: '/library/resources/publications',
				icon: IconWriting,
			},
			{
				label: 'Question Papers',
				href: '/library/resources/question-papers',
				icon: IconFileText,
			},
		],
	},
	{
		label: 'Settings',
		href: '/library/settings',
		icon: IconSettings,
		permissions: [{ resource: 'library', action: 'read' }],
	},
	{
		label: 'Students',
		href: '/registry/students',
		icon: IconUsers,
		permissions: [{ resource: 'students', action: 'read' }],
	},
	{
		label: 'Registration',
		href: '/registry/registration/requests',
		icon: IconUserPlus,
		permissions: [{ resource: 'registration', action: 'read' }],
	},
	{
		label: 'Tasks',
		href: '/admin/tasks',
		icon: IconChecklist,
		permissions: [{ resource: 'tasks', action: 'read' }],
	},
	{
		label: 'Mail',
		icon: IconMail,
		collapsed: true,
		children: [
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
		],
	},
];
