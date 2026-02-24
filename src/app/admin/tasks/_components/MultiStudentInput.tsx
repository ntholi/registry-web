'use client';

import {
	ActionIcon,
	Autocomplete,
	Badge,
	type BoxProps,
	Group,
	Loader,
	Stack,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { findAllStudents } from '@registry/students';
import { IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';

type StudentBasic = { stdNo: number; name: string };

interface MultiStudentInputProps extends BoxProps {
	value?: StudentBasic[];
	onChange?: (students: StudentBasic[]) => void;
	label?: string;
	error?: string;
	placeholder?: string;
	disabled?: boolean;
}

export default function MultiStudentInput({
	value = [],
	onChange,
	label,
	error,
	placeholder,
	disabled,
	...props
}: MultiStudentInputProps) {
	const [inputValue, setInputValue] = useState('');
	const skipNextInputChangeRef = useRef(false);
	const [debounced] = useDebouncedValue(inputValue, 300);

	const { data: searchResults = [], isLoading } = useQuery({
		queryKey: ['students-search', debounced],
		queryFn: async () => {
			if (!debounced || debounced.length < 2) return [];
			const result = await findAllStudents(1, debounced);
			return result.items.filter(
				(s) => !value.some((selected) => selected.stdNo === s.stdNo)
			);
		},
		enabled: !!debounced && debounced.length >= 2 && !disabled,
	});

	const options = searchResults.map((student) => ({
		value: String(student.stdNo),
		label: `${student.name} (${student.stdNo})`,
	}));

	function handleSelect(option: string) {
		const stdNo = Number(option);
		const selectedStudent = searchResults.find((s) => s.stdNo === stdNo);
		if (
			selectedStudent &&
			!value.some((s) => s.stdNo === selectedStudent.stdNo)
		) {
			onChange?.([...value, selectedStudent]);
		}
		skipNextInputChangeRef.current = true;
		setInputValue('');
	}

	function handleInputChange(next: string) {
		if (skipNextInputChangeRef.current) {
			skipNextInputChangeRef.current = false;
			return;
		}
		setInputValue(next);
	}

	function handleRemove(stdNo: number) {
		onChange?.(value.filter((s) => s.stdNo !== stdNo));
	}

	return (
		<Stack gap='xs' {...props}>
			<Autocomplete
				label={label}
				placeholder={placeholder}
				value={inputValue}
				onChange={handleInputChange}
				onOptionSubmit={handleSelect}
				data={options}
				disabled={disabled}
				renderOption={({ option }) => {
					const stdNo = Number(option.value);
					const student = searchResults.find((s) => s.stdNo === stdNo);
					return (
						<div>
							<div>{student?.name}</div>
							<div style={{ fontSize: '0.8em', color: 'gray' }}>
								{student?.stdNo}
							</div>
						</div>
					);
				}}
				rightSection={isLoading ? <Loader size='xs' /> : null}
				error={error}
			/>
			{value.length > 0 && (
				<Group gap='xs'>
					{value.map((student) => (
						<Badge
							key={student.stdNo}
							variant='light'
							rightSection={
								!disabled && (
									<ActionIcon
										size='xs'
										variant='transparent'
										onClick={() => handleRemove(student.stdNo)}
									>
										<IconX size={12} />
									</ActionIcon>
								)
							}
						>
							{student.name} ({student.stdNo})
						</Badge>
					))}
				</Group>
			)}
		</Stack>
	);
}
