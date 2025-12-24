'use client';

import { Box, Tabs } from '@mantine/core';
import {
	IconCardsFilled,
	IconCertificate2,
	IconClipboardTextFilled,
	IconFileCheck,
	IconSchool,
	IconUserFilled,
} from '@tabler/icons-react';
import { usePathname, useRouter } from 'next/navigation';
import type { Student } from '../_lib/utils';

const tabItems = [
	{ value: 'info', label: 'Student Info', icon: IconUserFilled },
	{ value: 'academics', label: 'Academics', icon: IconSchool },
	{
		value: 'registration',
		label: 'Registration',
		icon: IconClipboardTextFilled,
	},
	{ value: 'card', label: 'ID Card', icon: IconCardsFilled },
	{ value: 'documents', label: 'Documents', icon: IconFileCheck },
	{ value: 'graduation', label: 'Graduation', icon: IconCertificate2 },
] as const;

type Props = {
	student: Student;
	children: React.ReactNode;
};

export default function StudentTabs({ children, student }: Props) {
	const pathname = usePathname();
	const router = useRouter();

	const getActiveTab = () => {
		const parts = pathname.split('/');
		const possibleTab = parts[parts.length - 1];
		if (tabItems.some((tab) => tab.value === possibleTab)) {
			return possibleTab;
		}
		return 'info';
	};

	const handleTabChange = (value: string | null) => {
		if (!value) return;

		const basePath = `/registry/students/${student.stdNo}`;
		const newPath = value === 'info' ? basePath : `${basePath}/${value}`;
		router.push(newPath);
	};

	return (
		<Tabs
			value={getActiveTab()}
			onChange={handleTabChange}
			keepMounted={false}
			styles={{
				root: {
					display: 'flex',
					flexDirection: 'column',
					height: '100%',
					overflow: 'hidden',
				},
				panel: {
					flex: 1,
					overflowY: 'auto',
				},
			}}
		>
			<Tabs.List>
				{tabItems.map((tab) => (
					<Tabs.Tab
						key={tab.value}
						value={tab.value}
						leftSection={<tab.icon size={16} />}
					>
						{tab.label}
					</Tabs.Tab>
				))}
			</Tabs.List>

			{tabItems.map((tab) => (
				<Tabs.Panel key={tab.value} value={tab.value}>
					<Box p='md'>{children}</Box>
				</Tabs.Panel>
			))}
		</Tabs>
	);
}
