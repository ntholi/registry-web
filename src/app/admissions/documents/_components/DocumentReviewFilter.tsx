'use client';

import {
	ActionIcon,
	Button,
	Group,
	Indicator,
	Modal,
	Select,
	Stack,
	Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter, IconX } from '@tabler/icons-react';
import { useState } from 'react';

const statusOptions = [
	{ value: 'pending', label: 'Pending' },
	{ value: 'verified', label: 'Verified' },
	{ value: 'rejected', label: 'Rejected' },
];

const typeOptions = [
	{ value: 'identity', label: 'Identity' },
	{ value: 'certificate', label: 'Certificate' },
	{ value: 'academic_record', label: 'Academic Record' },
];

interface Props {
	statusValue: string;
	typeValue: string;
	onApply: (filters: { status: string; type: string }) => void;
}

export default function DocumentReviewFilter({
	statusValue,
	typeValue,
	onApply,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [status, setStatus] = useState(statusValue);
	const [type, setType] = useState(typeValue);

	const activeFiltersCount = [statusValue, typeValue].filter(
		(value) => value !== 'all'
	).length;

	const isDefaultFilter = statusValue === 'all' && typeValue === 'all';

	function handleOpen() {
		setStatus(statusValue);
		setType(typeValue);
		open();
	}

	function handleClear() {
		setStatus('all');
		setType('all');
		onApply({ status: 'all', type: 'all' });
		close();
	}

	function handleApply() {
		onApply({ status, type });
		close();
	}

	return (
		<>
			<Tooltip label='Filter documents'>
				<Indicator
					label={activeFiltersCount || undefined}
					size={16}
					color='red'
					disabled={activeFiltersCount === 0}
				>
					<ActionIcon
						variant={isDefaultFilter ? 'default' : 'filled'}
						color='blue'
						onClick={handleOpen}
						size='input-sm'
					>
						<IconFilter size={16} />
					</ActionIcon>
				</Indicator>
			</Tooltip>

			<Modal opened={opened} onClose={close} title='Filter Documents' size='sm'>
				<Stack gap='md'>
					<Select
						label='Verification Status'
						placeholder='All statuses'
						data={statusOptions}
						value={status === 'all' ? null : status}
						onChange={(value) => setStatus(value || 'all')}
						clearable
					/>

					<Select
						label='Document Type'
						placeholder='All types'
						data={typeOptions}
						value={type === 'all' ? null : type}
						onChange={(value) => setType(value || 'all')}
						clearable
					/>

					<Group justify='space-between' mt='md'>
						<Button
							variant='subtle'
							color='gray'
							leftSection={<IconX size={16} />}
							onClick={handleClear}
							disabled={isDefaultFilter}
						>
							Clear All
						</Button>
						<Button onClick={handleApply}>Apply Filters</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
