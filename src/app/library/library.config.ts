import {
	IconBook2,
	IconCash,
	IconCategory,
	IconFileText,
	IconLibrary,
	IconTags,
	IconUsers,
	IconWriting,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';

export const libraryConfig: ModuleConfig = {
	id: 'library',
	name: 'Library',
	version: '1.0.0',
	category: 'core',
	navigation: {
		dashboard: [
			{
				label: 'Books',
				href: '/library/books',
				icon: IconBook2,
				roles: ['admin', 'library'],
			},
			{
				label: 'Loans',
				href: '/library/loans',
				icon: IconLibrary,
				roles: ['admin', 'library'],
			},
			{
				label: 'Authors',
				href: '/library/authors',
				icon: IconUsers,
				roles: ['admin', 'library'],
			},
			{
				label: 'Categories',
				href: '/library/categories',
				icon: IconCategory,
				roles: ['admin', 'library'],
			},
			{
				label: 'Fines',
				href: '/library/fines',
				icon: IconCash,
				roles: ['admin', 'library'],
			},
			{
				label: 'Resources',
				icon: IconTags,
				collapsed: true,
				roles: ['admin', 'library'],
				children: [
					{
						label: 'Publications',
						href: '/library/resources/publications',
						icon: IconWriting,
						roles: ['admin', 'library'],
					},
					{
						label: 'Question Papers',
						href: '/library/resources/question-papers',
						icon: IconFileText,
						roles: ['admin', 'library'],
					},
				],
			},
		],
	},
	flags: {
		enabled: true,
		beta: false,
	},
};
