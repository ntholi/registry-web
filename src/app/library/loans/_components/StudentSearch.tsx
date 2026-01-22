'use client';

import { Autocomplete, Box, Loader, Stack, Text } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { StudentSearchResult } from '../_lib/types';
import { searchStudents } from '../_server/actions';

type Props = {
	onSelect: (student: StudentSearchResult) => void;
	selectedStudent?: StudentSearchResult | null;
};

export default function StudentSearch({ onSelect, selectedStudent }: Props) {
	const [search, setSearch] = useState('');
	const [debounced] = useDebouncedValue(search, 300);

	const { data: students = [], isLoading } = useQuery({
		queryKey: ['student-search', debounced],
		queryFn: () => searchStudents(debounced),
		enabled: debounced.length >= 2,
	});

	const options = students.map((s) => ({
		value: String(s.stdNo),
		student: s,
	}));

	function handleSelect(value: string) {
		const selected = options.find((o) => o.value === value);
		if (selected) {
			onSelect(selected.student);
			setSearch('');
		}
	}

	return (
		<Box>
			<Autocomplete
				label='Search Student'
				placeholder='Enter student number or name'
				value={search}
				onChange={setSearch}
				onOptionSubmit={handleSelect}
				data={options.map((o) => o.value)}
				leftSection={
					isLoading ? <Loader size={16} /> : <IconSearch size={16} />
				}
				filter={({ options }) => options}
				renderOption={({ option }) => {
					const student = students.find(
						(s) => String(s.stdNo) === option.value
					);
					return (
						<Stack gap={0}>
							<Text size='sm' fw={500}>
								{student?.stdNo}
							</Text>
							<Text size='xs' c='dimmed'>
								{student?.name}
							</Text>
						</Stack>
					);
				}}
			/>
			{selectedStudent && (
				<Text
					mt={'xs'}
					size='xs'
					pl={2}
					c={selectedStudent.activeLoansCount > 0 ? 'red' : 'blue'}
				>
					{selectedStudent.activeLoansCount > 0
						? selectedStudent.activeLoansCount
						: 'No '}{' '}
					active loan
					{selectedStudent.activeLoansCount !== 1 ? 's' : ''}
				</Text>
			)}
		</Box>
	);
}
