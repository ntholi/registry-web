import { IconBook2, IconTags, IconUsers } from '@tabler/icons-react';

export const libraryConfig = {
	title: 'Library',
	path: '/library',
	navItems: [
		{ label: 'Books', href: '/library/books', icon: IconBook2 },
		{ label: 'Authors', href: '/library/authors', icon: IconUsers },
		{ label: 'Categories', href: '/library/categories', icon: IconTags },
	],
};
