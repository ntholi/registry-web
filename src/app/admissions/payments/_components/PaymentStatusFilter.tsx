'use client';

import { ActionIcon, Modal, Paper, Select, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import type { TransactionStatus } from '../_lib/types';

interface Props {
	value?: TransactionStatus | 'all';
	onChange: (value: TransactionStatus | 'all') => void;
}

export default function PaymentStatusFilter({ value, onChange }: Props) {
	const [opened, { open, close }] = useDisclosure(false);

	function handleSelect(val: string | null) {
		if (val) {
			onChange(val as TransactionStatus | 'all');
		}
		close();
	}

	const options = [
		{ value: 'all', label: 'All' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'success', label: 'Success' },
		{ value: 'failed', label: 'Failed' },
	];

	return (
		<>
			<Tooltip label='Filter by status'>
				<ActionIcon
					variant={value && value !== 'all' ? 'white' : 'default'}
					color='blue'
					onClick={open}
					size='input-sm'
				>
					<IconFilter size={16} />
				</ActionIcon>
			</Tooltip>

			<Modal opened={opened} onClose={close} title='Filter by Status' size='sm'>
				<Paper p='lg' pb='xl' withBorder>
					<Select
						label='Select Status'
						data={options}
						value={value || 'all'}
						onChange={handleSelect}
						clearable={false}
					/>
				</Paper>
			</Modal>
		</>
	);
}
