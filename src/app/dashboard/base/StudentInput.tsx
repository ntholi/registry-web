'use client';

import { Autocomplete, Avatar, Box, Group, Loader, Text } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { findAllStudents } from '@registry/students';
import { IconCheck, IconSearch, IconUser } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

type Props = {
	value?: number | string;
	onChange?: (value: number | string) => void;
	error?: React.ReactNode;
	disabled?: boolean;
	label?: string;
	placeholder?: string;
	required?: boolean;
};

function formatStudentLabel(name: string, stdNo: number | string) {
	return `${name} (${stdNo})`;
}

export default function StudentInput({
	value,
	onChange,
	error,
	disabled,
	label = 'Student',
	placeholder = 'Search by name or student number...',
	required,
}: Props) {
	const [inputValue, setInputValue] = useState(() =>
		value ? String(value) : ''
	);
	const [isSelected, setIsSelected] = useState(() => Boolean(value));
	const [debounced] = useDebouncedValue(inputValue, 350);

	const { data: results, isLoading } = useQuery({
		queryKey: ['student-search', debounced],
		queryFn: () => findAllStudents(1, debounced),
		enabled: debounced.length >= 2 && !isSelected,
		select: (data) => data.items,
	});

	const options = (results ?? []).map((s) => ({
		value: formatStudentLabel(s.name, s.stdNo),
	}));

	function handleSelect(val: string) {
		const student = results?.find(
			(s) => formatStudentLabel(s.name, s.stdNo) === val
		);
		setInputValue(
			student ? formatStudentLabel(student.name, student.stdNo) : val
		);
		setIsSelected(true);
		onChange?.(student ? Number(student.stdNo) : '');
	}

	function handleChange(val: string) {
		setInputValue(val);

		const student = results?.find(
			(s) => formatStudentLabel(s.name, s.stdNo) === val
		);
		if (student) {
			setIsSelected(true);
			onChange?.(Number(student.stdNo));
			return;
		}

		setIsSelected(false);
		if (value) onChange?.('');
	}

	return (
		<Box>
			<Autocomplete
				label={label}
				placeholder={placeholder}
				value={inputValue}
				onChange={handleChange}
				onOptionSubmit={handleSelect}
				data={options}
				leftSection={
					isLoading ? (
						<Loader size='xs' />
					) : isSelected ? (
						<IconCheck size={16} color='green' />
					) : (
						<IconSearch size={16} />
					)
				}
				error={error}
				disabled={disabled}
				required={required}
				filter={({ options }) => options}
				renderOption={({ option }) => {
					const student = results?.find(
						(s) => formatStudentLabel(s.name, s.stdNo) === option.value
					);
					return (
						<Group gap='sm' px={4}>
							<Avatar size={36} radius='xl' color='blue'>
								{student?.name.charAt(0) ?? <IconUser size={18} />}
							</Avatar>
							<Box>
								<Text size='sm' fw={500}>
									{student?.name}
								</Text>
								<Text size='xs' c='dimmed'>
									{student?.stdNo}
								</Text>
							</Box>
						</Group>
					);
				}}
			/>
		</Box>
	);
}
