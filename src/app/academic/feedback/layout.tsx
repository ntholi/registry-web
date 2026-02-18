'use client';

import { Container, Tabs } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

type Props = {
	children: ReactNode;
};

const tabs = [
	{
		value: 'categories',
		label: 'Categories',
		href: '/academic/feedback/categories',
	},
	{
		value: 'questions',
		label: 'Questions',
		href: '/academic/feedback/questions',
	},
	{ value: 'periods', label: 'Periods', href: '/academic/feedback/periods' },
];

export default function FeedbackLayout({ children }: Props) {
	const pathname = usePathname();
	const router = useRouter();

	const active =
		tabs.find((t) => pathname.startsWith(t.href))?.value ?? 'categories';

	return (
		<Container size='xl'>
			<Tabs
				value={active}
				onChange={(value) => {
					const tab = tabs.find((t) => t.value === value);
					if (tab) router.push(tab.href);
				}}
			>
				<Tabs.List>
					{tabs.map((tab) => (
						<Tabs.Tab key={tab.value} value={tab.value}>
							{tab.label}
						</Tabs.Tab>
					))}
				</Tabs.List>
			</Tabs>
			{children}
		</Container>
	);
}
