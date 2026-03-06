'use client';

import {
	Autocomplete,
	Avatar,
	Box,
	Group,
	Loader,
	Paper,
	Text,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import {
	findAllStudents,
	getStudent,
	getStudentPhoto,
} from '@registry/students';
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
	const [isSelected, setIsSelected] = useState(false);
	const [debounced] = useDebouncedValue(inputValue, 350);

	const committedStdNo = value ? Number(value) || null : null;
	const showCard = isSelected && !!committedStdNo;

	const { data: results, isLoading } = useQuery({
		queryKey: ['student-search', debounced],
		queryFn: () => findAllStudents(1, debounced),
		enabled: debounced.length >= 2 && !isSelected,
		select: (data) => data.items,
	});

	const { data: selectedStudent } = useQuery({
		queryKey: ['student', committedStdNo],
		queryFn: () => getStudent(committedStdNo!),
		enabled: !!committedStdNo,
	});

	const { data: photoUrl } = useQuery({
		queryKey: ['student-photo', committedStdNo],
		queryFn: () => getStudentPhoto(committedStdNo),
		enabled: !!committedStdNo,
	});

	const options = (results ?? []).map((s) => ({
		value: String(s.stdNo),
		label: `${s.stdNo} - ${s.name}`,
	}));

	function handleSelect(val: string) {
		const student = results?.find((s) => String(s.stdNo) === val);
		setInputValue(student ? `${student.name} (${student.stdNo})` : val);
		setIsSelected(true);
		onChange?.(Number(val));
	}

	function handleChange(val: string) {
		setInputValue(val);
		setIsSelected(false);
		if (!val) onChange?.('');
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
					) : isSelected && committedStdNo ? (
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
						(s) => String(s.stdNo) === option.value
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
			{showCard && selectedStudent && (
				<Paper withBorder p='sm' mt='xs' radius='md' bg='transparent'>
					<Group gap='sm'>
						<Avatar
							size={46}
							radius='xl'
							src={photoUrl ?? undefined}
							color='blue'
						>
							<IconUser size={22} />
						</Avatar>
						<Box>
							<Text fw={600} size='sm'>
								{selectedStudent.name}
							</Text>
							<Text size='xs' c='dimmed'>
								{selectedStudent.stdNo}
							</Text>
						</Box>
					</Group>
				</Paper>
			)}
		</Box>
	);
}
