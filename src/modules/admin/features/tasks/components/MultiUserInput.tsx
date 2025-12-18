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
import { useEffect, useState } from 'react';
import type { users } from '@/core/database';

type User = typeof users.$inferSelect;

interface MultiUserInputProps extends BoxProps {
	role?: User['role'];
	value?: User[];
	onChange?: (users: User[]) => void;
	label?: string;
	error?: string;
	placeholder?: string;
}

export default function MultiUserInput({
	role,
	value = [],
	onChange,
	label,
	error,
	placeholder,
	...props
}: MultiUserInputProps) {
	const [inputValue, setInputValue] = useState('');
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [debounced] = useDebouncedValue(inputValue, 300);

	useEffect(() => {
		async function searchUsers() {
			if (!debounced) {
				setSearchResults([]);
				return;
			}

			setIsSearching(true);
			try {
				const result = await findAllByRole(1, debounced, role);
				const filteredUsers = result.items.filter(
					(u) => !value.some((selected) => selected.id === u.id)
				);
				setSearchResults(filteredUsers);
			} catch (err) {
				console.error('Error searching users:', err);
			} finally {
				setIsSearching(false);
			}
		}

		searchUsers();
	}, [debounced, role, value]);

	const options = searchResults.map((user) => ({
		value: `${user.id}:${user.name || user.email}`,
		label: `${user.name || 'Unnamed User'} (${user.email})`,
	}));

	function handleSelect(option: string) {
		const userId = option.split(':')[0];
		const selectedUser = searchResults.find((u) => u.id === userId);
		if (selectedUser && !value.some((u) => u.id === selectedUser.id)) {
			onChange?.([...value, selectedUser]);
			setInputValue('');
			setSearchResults([]);
		}
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
				onChange={setInputValue}
				onOptionSubmit={handleSelect}
				data={options}
				renderOption={({ option }) => {
					const userId = option.value.split(':')[0];
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
				rightSection={isSearching ? <Loader size='xs' /> : null}
				error={error}
			/>
			{value.length > 0 && (
				<Group gap='xs'>
					{value.map((user) => (
						<Badge
							key={user.id}
							variant='light'
							rightSection={
								<ActionIcon
									size='xs'
									variant='transparent'
									onClick={() => handleRemove(user.id)}
								>
									<IconX size={12} />
								</ActionIcon>
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
