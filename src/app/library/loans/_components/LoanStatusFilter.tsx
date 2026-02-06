'use client';

import { ActionIcon, Modal, Paper, Select, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import type { LoanStatus } from '../_lib/types';

interface LoanStatusFilterProps {
	value?: LoanStatus | 'all';
	onChange: (value: LoanStatus | 'all') => void;
	label?: string;
	size?: number;
	color?: string;
	variant?: string;
}

export default function LoanStatusFilter({
	value,
	onChange,
	label = 'Filter by loan status',
	size = 16,
	color = 'blue',
	variant = 'default',
}: LoanStatusFilterProps) {
	const [opened, { open, close }] = useDisclosure(false);

	const handleStatusSelect = (val: string | null) => {
		if (val) {
			onChange(val as LoanStatus | 'all');
		}
		close();
	};

	const statusOptions = [
		{ value: 'all', label: 'All' },
		{ value: 'Active', label: 'Active' },
		{ value: 'Overdue', label: 'Overdue' },
		{ value: 'Returned', label: 'Returned' },
	];

	return (
		<>
			<Tooltip label={label}>
				<ActionIcon
					variant={value && value !== 'all' ? 'white' : variant}
					color={color}
					onClick={open}
					size={'input-sm'}
				>
					<IconFilter size={size} />
				</ActionIcon>
			</Tooltip>

			<Modal
				opened={opened}
				onClose={close}
				title='Filter by Loan Status'
				size='sm'
				p={'lg'}
			>
				<Paper p={'lg'} pb={'xl'} withBorder>
					<Select
						label='Select Status'
						placeholder='Choose a status'
						data={statusOptions}
						value={value || 'all'}
						onChange={handleStatusSelect}
						clearable={false}
					/>
				</Paper>
			</Modal>
		</>
	);
}
