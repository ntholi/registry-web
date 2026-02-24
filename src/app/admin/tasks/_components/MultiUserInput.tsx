'use client';

import { findAllByRole } from '@admin/users';
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
import { IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import type { users } from '@/core/database';

type User = typeof users.$inferSelect;

interface MultiUserInputProps extends BoxProps {
	role?: User['role'];
	value?: User[];
	onChange?: (users: User[]) => void;
	label?: string;
	error?: string;
	placeholder?: string;
	disabled?: boolean;
}

export default function MultiUserInput({
	role,
	value = [],
	onChange,
	label,
	error,
	placeholder,
	disabled,
	...props
}: MultiUserInputProps) {
	const [inputValue, setInputValue] = useState('');
	const skipNextInputChangeRef = useRef(false);
	const [debounced] = useDebouncedValue(inputValue, 300);

	const { data: searchResults = [], isLoading } = useQuery({
		queryKey: ['users-search', debounced, role],
		queryFn: async () => {
			if (!debounced) return [];
			const result = await findAllByRole(1, debounced, role);
			return result.items.filter(
				(u) => !value.some((selected) => selected.id === u.id)
			);
		},
		enabled: !!debounced && !disabled,
	});

	const options = searchResults.map((user) => ({
		value: user.id,
		label: `${user.name || 'Unnamed User'} (${user.email})`,
	}));

	function handleSelect(option: string) {
		const userId = option;
		const selectedUser = searchResults.find((u) => u.id === userId);
		if (selectedUser && !value.some((u) => u.id === selectedUser.id)) {
			onChange?.([...value, selectedUser]);
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

	function handleRemove(userId: string) {
		onChange?.(value.filter((u) => u.id !== userId));
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
					const userId = option.value;
					const user = searchResults.find((u) => u.id === userId);
					return (
						<div>
							<div>{user?.name || 'Unnamed User'}</div>
							<div style={{ fontSize: '0.8em', color: 'gray' }}>
								{user?.email}
							</div>
						</div>
					);
				}}
				rightSection={isLoading ? <Loader size='xs' /> : null}
				error={error}
			/>
			{value.length > 0 && (
				<Group gap='xs'>
					{value.map((user) => (
						<Badge
							key={user.id}
							variant='light'
							rightSection={
								!disabled && (
									<ActionIcon
										size='xs'
										variant='transparent'
										onClick={() => handleRemove(user.id)}
									>
										<IconX size={12} />
									</ActionIcon>
								)
							}
						>
							{user.name || user.email}
						</Badge>
					))}
				</Group>
			)}
		</Stack>
	);
}
