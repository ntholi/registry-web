'use client';

import { Alert, rem, SimpleGrid, Tabs } from '@mantine/core';
import {
	IconAlertCircle,
	IconBriefcase,
	IconMail,
	IconUser,
} from '@tabler/icons-react';
import { toTitleCase } from '@/shared/lib/utils/utils';
import InfoItem from '@/shared/ui/InfoItem';
import MailAccountCards from './MailAccountCards';

type Account = {
	id: string;
	email: string;
	displayName: string | null;
	isPrimary: boolean;
	isActive: boolean;
	createdAt: Date;
};

type Employee = {
	empNo: string;
	department: string | null;
	position: string | null;
	status: string;
	schools: string;
};

type Props = {
	accounts: Account[];
	user: {
		id: string;
		name: string;
		email: string;
		role: string;
		presetName: string | null;
	};
	employee: Employee | null;
};

export default function ProfileContent({ accounts, user, employee }: Props) {
	const iconStyle = { width: rem(16), height: rem(16) };

	return (
		<Tabs defaultValue='mail' variant='default'>
			<Tabs.List justify='center'>
				<Tabs.Tab value='mail' leftSection={<IconMail style={iconStyle} />}>
					Mail Accounts
				</Tabs.Tab>
				<Tabs.Tab value='account' leftSection={<IconUser style={iconStyle} />}>
					Account
				</Tabs.Tab>
				<Tabs.Tab
					value='staff'
					leftSection={<IconBriefcase style={iconStyle} />}
				>
					Staff Record
				</Tabs.Tab>
			</Tabs.List>

			<Tabs.Panel value='mail' pt='lg'>
				<MailAccountCards accounts={accounts} />
			</Tabs.Panel>

			<Tabs.Panel value='account' pt='lg'>
				<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
					<InfoItem label='Full Name' value={user.name} />
					<InfoItem label='Email Address' value={user.email} />
					<InfoItem
						label='Role'
						value={toTitleCase(user.role)}
						copyable={false}
					/>
					<InfoItem
						label='Permission Preset'
						value={user.presetName ?? 'Role-only access'}
						copyable={false}
					/>
				</SimpleGrid>
			</Tabs.Panel>

			<Tabs.Panel value='staff' pt='lg'>
				{employee ? (
					<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
						<InfoItem label='Employee Number' value={employee.empNo} />
						<InfoItem
							label='Department'
							value={employee.department ?? 'N/A'}
							copyable={false}
						/>
						<InfoItem
							label='Position'
							value={employee.position ?? 'N/A'}
							copyable={false}
						/>
						<InfoItem label='Status' value={employee.status} copyable={false} />
						<InfoItem
							label='Schools'
							value={employee.schools || 'N/A'}
							copyable={false}
						/>
					</SimpleGrid>
				) : (
					<Alert
						variant='light'
						color='blue'
						icon={<IconAlertCircle size='1rem' />}
					>
						No employee record is linked to this account yet.
					</Alert>
				)}
			</Tabs.Panel>
		</Tabs>
	);
}
