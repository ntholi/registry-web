'use client';

import { ActionIcon, Menu } from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';

type Props = {
	value: string;
	onChange: (value: string | null) => void;
};

export default function DepositStatusFilter({ value, onChange }: Props) {
	return (
		<Menu position='bottom-end'>
			<Menu.Target>
				<ActionIcon variant={value !== 'all' ? 'filled' : 'subtle'}>
					<IconFilter size={16} />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Label>Status</Menu.Label>
				<Menu.Item
					onClick={() => onChange('all')}
					bg={value === 'all' ? 'var(--mantine-color-blue-light)' : undefined}
				>
					All
				</Menu.Item>
				<Menu.Item
					onClick={() => onChange('pending')}
					bg={
						value === 'pending' ? 'var(--mantine-color-blue-light)' : undefined
					}
				>
					Pending
				</Menu.Item>
				<Menu.Item
					onClick={() => onChange('verified')}
					bg={
						value === 'verified' ? 'var(--mantine-color-blue-light)' : undefined
					}
				>
					Verified
				</Menu.Item>
				<Menu.Item
					onClick={() => onChange('rejected')}
					bg={
						value === 'rejected' ? 'var(--mantine-color-blue-light)' : undefined
					}
				>
					Rejected
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}
