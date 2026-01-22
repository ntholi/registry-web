import {
	IconBook2,
	IconCash,
	IconCategory,
	IconLibrary,
	IconTags,
	IconUsers,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';

export const libraryConfig: ModuleConfig = {
	id: 'library',
	name: 'Library',
	version: '1.0.0',
	category: 'core',
	navigation: {
		dashboard: [
			{ label: 'Books', href: '/library/books', icon: IconBook2 },
			{ label: 'Loans', href: '/library/loans', icon: IconLibrary },
			{ label: 'Authors', href: '/library/authors', icon: IconUsers },
			{ label: 'Categories', href: '/library/categories', icon: IconCategory },
			{ label: 'Fines', href: '/library/fines', icon: IconCash },
			{ label: 'Resources', href: '/library/resources', icon: IconTags },
		],
	},
	flags: {
		enabled: true,
		beta: false,
	},
};
