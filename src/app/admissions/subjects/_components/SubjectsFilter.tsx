'use client';

import {
	ActionIcon,
	Button,
	Group,
	HoverCard,
	Modal,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';
import { getBooleanColor } from '@/shared/lib/utils/colors';

const lqfLevelOptions = [
	{ value: '1', label: 'Level 1' },
	{ value: '2', label: 'Level 2' },
	{ value: '3', label: 'Level 3' },
	{ value: '4', label: 'Level 4 (Secondary)' },
	{ value: '5', label: 'Level 5' },
	{ value: '6', label: 'Level 6' },
	{ value: '7', label: 'Level 7' },
	{ value: '8', label: 'Level 8' },
	{ value: '9', label: 'Level 9' },
	{ value: '10', label: 'Level 10' },
	{ value: 'null', label: 'Not Set' },
];

export default function SubjectsFilter() {
	const [opened, { toggle, close }] = useDisclosure(false);

	const [lqfLevel, setLqfLevel] = useQueryState('lqfLevel');

	const [filter, setFilter] = useState(lqfLevel || '4');

	useEffect(() => {
		setFilter(lqfLevel || '4');
	}, [lqfLevel]);

	const description = useMemo(() => {
		const selected = lqfLevelOptions.find((l) => l.value === filter);
		return selected ? `Showing ${selected.label} subjects` : 'All subjects';
	}, [filter]);

	const handleApplyFilters = () => {
		setLqfLevel(filter === '4' ? null : filter);
		close();
	};

	const handleClearFilters = () => {
		setFilter('4');
		setLqfLevel(null);
		close();
	};

	const hasActiveFilters = lqfLevel && lqfLevel !== '4';

	return (
		<>
			<HoverCard withArrow position='top'>
				<HoverCard.Target>
					<ActionIcon
						variant={hasActiveFilters ? 'white' : 'default'}
						size={33}
						onClick={toggle}
						color={getBooleanColor(!!hasActiveFilters, 'highlight')}
					>
						<IconFilter size='1rem' />
					</ActionIcon>
				</HoverCard.Target>
				<HoverCard.Dropdown>
					<Text size='xs'>Filter Subjects</Text>
				</HoverCard.Dropdown>
			</HoverCard>

			<Modal opened={opened} onClose={close} title='Filter Subjects' size='sm'>
				<Stack gap='md'>
					<Select
						label='LQF Level'
						description='Lesotho Qualifications Framework level'
						placeholder='Select level'
						data={lqfLevelOptions}
						value={filter}
						onChange={(value) => setFilter(value || '4')}
						clearable={false}
					/>

					<Text size='sm' c='dimmed'>
						{description}
					</Text>

					<Group justify='flex-end' gap='sm'>
						<Button variant='outline' onClick={handleClearFilters}>
							Reset to Level 4
						</Button>
						<Button onClick={handleApplyFilters}>Apply Filter</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
