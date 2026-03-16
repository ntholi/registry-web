'use client';

import type { ProgramLevel } from '@academic/_database';
import { getAllSchools } from '@academic/schools';
import {
	ActionIcon,
	Button,
	Group,
	HoverCard,
	Loader,
	Modal,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';
import { getBooleanColor } from '@/shared/lib/utils/colors';

const levelOptions: { value: ProgramLevel; label: string }[] = [
	{ value: 'certificate', label: 'Certificate' },
	{ value: 'diploma', label: 'Diploma' },
	{ value: 'degree', label: 'Degree' },
];

export default function EntryRequirementsFilter() {
	const [opened, { toggle, close }] = useDisclosure(false);

	const [schoolId, setSchoolId] = useQueryState('schoolId');
	const [level, setLevel] = useQueryState('level');

	const [filters, setFilters] = useState({
		schoolId: schoolId || '',
		level: level || '',
	});

	useEffect(() => {
		setFilters({
			schoolId: schoolId || '',
			level: level || '',
		});
	}, [schoolId, level]);

	const { data: schools = [], isLoading: schoolLoading } = useQuery({
		queryKey: ['schools'],
		queryFn: getAllSchools,
		enabled: opened,
	});

	const description = useMemo(() => {
		const selectedSchool = schools.find(
			(s: { id: number }) => s.id?.toString() === (filters.schoolId || '')
		);
		const selectedLevel = levelOptions.find((l) => l.value === filters.level);

		const parts: string[] = [];
		if (selectedSchool) parts.push(selectedSchool.code);
		if (selectedLevel) parts.push(selectedLevel.label);

		return parts.length > 0
			? `${parts.join(' ')} programs`
			: 'All programs with requirements';
	}, [filters.schoolId, filters.level, schools]);

	const handleApplyFilters = () => {
		setSchoolId(filters.schoolId || null);
		setLevel(filters.level || null);
		close();
	};

	const handleClearFilters = () => {
		setFilters({ schoolId: '', level: '' });
		setSchoolId(null);
		setLevel(null);
		close();
	};

	const hasActiveFilters = schoolId || level;

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
					<Text size='xs'>Filter Requirements</Text>
				</HoverCard.Dropdown>
			</HoverCard>

			<Modal
				opened={opened}
				onClose={close}
				title='Filter Entry Requirements'
				size='sm'
			>
				<Stack gap='md'>
					<Select
						label='School'
						placeholder='Select school'
						data={schools.map((school: { id: number; name: string }) => ({
							value: school.id?.toString() || '',
							label: school.name,
						}))}
						rightSection={schoolLoading && <Loader size='xs' />}
						value={filters.schoolId || null}
						onChange={(value) =>
							setFilters((prev) => ({ ...prev, schoolId: value || '' }))
						}
						searchable
						clearable
					/>

					<Select
						label='Program Level'
						placeholder='Select level'
						data={levelOptions}
						value={filters.level || null}
						onChange={(value) =>
							setFilters((prev) => ({ ...prev, level: value || '' }))
						}
						clearable
					/>

					<Text size='sm' c='dimmed'>
						{description}
					</Text>

					<Group justify='flex-end' gap='sm'>
						<Button variant='outline' onClick={handleClearFilters}>
							Clear All
						</Button>
						<Button onClick={handleApplyFilters}>Apply Filters</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
