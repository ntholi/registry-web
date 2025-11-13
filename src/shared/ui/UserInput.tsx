import { Autocomplete, type BoxProps, Loader } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import type { users } from '@/core/database/schema';
import { findAllByRole } from '@/modules/admin/features/users/server/actions';

type User = typeof users.$inferSelect;

interface UserInputProps extends BoxProps {
	role?: User['role'];
	value?: User | null;
	onChange?: (user: User | null) => void;
	label?: string;
	error?: string;
	placeholder?: string;
}

export default function UserInput({
	role,
	value,
	onChange,
	label,
	error,
	placeholder,
	...props
}: UserInputProps) {
	const [inputValue, setInputValue] = useState(() =>
		value ? `${value.name || value.email}` : ''
	);
	const [users, setUsers] = useState<User[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [debounced] = useDebouncedValue(inputValue, 300);

	useEffect(() => {
		async function searchUsers() {
			if (!debounced) {
				setUsers([]);
				return;
			}

			setIsSearching(true);
			try {
				const result = await findAllByRole(1, debounced, role);
				setUsers(result.items);
			} catch (error) {
				console.error('Error searching users:', error);
			} finally {
				setIsSearching(false);
			}
		}

		searchUsers();
	}, [debounced, role]);

	const options = users.map((user) => ({
		value: `${user.id}:${user.name || user.email}`,
		label: `${user.name || 'Unnamed User'} (${user.email})`,
	}));

	return (
		<Autocomplete
			label={label}
			placeholder={placeholder}
			value={inputValue}
			onChange={(newValue) => {
				setInputValue(newValue);
			}}
			onOptionSubmit={(option) => {
				const selectedUser = users.find(
					(u) => `${u.id}:${u.name || u.email}` === option
				);
				if (selectedUser) {
					onChange?.(selectedUser);
				}
			}}
			data={options}
			renderOption={({ option }) => {
				const userId = option.value.split(':')[0];
				const user = users.find((u) => u.id === userId);
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
			{...props}
		/>
	);
}
