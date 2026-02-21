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

const DEFAULT_STATUS = 'pending';
const DEFAULT_TYPE = 'all';

const statusOptions = [
	{ value: 'all', label: 'All Status' },
	{ value: 'pending', label: 'Pending' },
	{ value: 'verified', label: 'Verified' },
	{ value: 'rejected', label: 'Rejected' },
];

const typeOptions = [
	{ value: 'all', label: 'All Types' },
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

	const activeFiltersCount = [
		statusValue !== DEFAULT_STATUS,
		typeValue !== DEFAULT_TYPE,
	].filter(Boolean).length;

	const isDefaultFilter =
		statusValue === DEFAULT_STATUS && typeValue === DEFAULT_TYPE;

	function handleOpen() {
		setStatus(statusValue);
		setType(typeValue);
		open();
	}

	function handleClear() {
		setStatus(DEFAULT_STATUS);
		setType(DEFAULT_TYPE);
		onApply({ status: DEFAULT_STATUS, type: DEFAULT_TYPE });
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
						placeholder='Select status'
						data={statusOptions}
						value={status}
						onChange={(value) => setStatus(value || DEFAULT_STATUS)}
						clearable
					/>

					<Select
						label='Document Type'
						placeholder='Select type'
						data={typeOptions}
						value={type}
						onChange={(value) => setType(value || DEFAULT_TYPE)}
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
