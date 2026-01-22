'use client';

import { ActionIcon, Modal, Paper, Select, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import { RESOURCE_TYPE_OPTIONS, type ResourceType } from '../_lib/types';

interface ResourceTypeFilterProps {
	value?: ResourceType | 'all';
	onChange: (value: ResourceType | 'all') => void;
	label?: string;
	size?: number;
	color?: string;
	variant?: string;
}

export default function ResourceTypeFilter({
	value,
	onChange,
	label = 'Filter by resource type',
	size = 16,
	color = 'blue',
	variant = 'default',
}: ResourceTypeFilterProps) {
	const [opened, { open, close }] = useDisclosure(false);

	const handleTypeSelect = (val: string | null) => {
		if (val) {
			onChange(val as ResourceType | 'all');
		}
		close();
	};

	const typeOptions = [
		{ value: 'all', label: 'All' },
		...RESOURCE_TYPE_OPTIONS,
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
				title='Filter by Resource Type'
				size='sm'
				p={'lg'}
			>
				<Paper p={'lg'} pb={'xl'} withBorder>
					<Select
						label='Select Resource Type'
						placeholder='Choose a type'
						data={typeOptions}
						value={value || 'all'}
						onChange={handleTypeSelect}
						clearable={false}
					/>
				</Paper>
			</Modal>
		</>
	);
}
