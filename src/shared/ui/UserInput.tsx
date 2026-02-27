import { findAllByRole } from '@admin/users';
import {
	Autocomplete,
	Avatar,
	type BoxProps,
	Group,
	Loader,
	Stack,
	Text,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import type { users } from '@/core/database';

type User = typeof users.$inferSelect;

interface UserInputProps extends BoxProps {
	role?: User['role'];
	value?: User | null;
	onChange?: (user: User | null) => void;
	label?: string;
	error?: string;
	placeholder?: string;
	emailDomain?: string;
}

export default function UserInput({
	role,
	value,
	onChange,
	label,
	error,
	placeholder,
	emailDomain,
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
				const filtered = emailDomain
					? result.items.filter((u) => u.email?.endsWith(emailDomain))
					: result.items;
				setUsers(filtered);
			} catch {
				setUsers([]);
			} finally {
				setIsSearching(false);
			}
		}

		searchUsers();
	}, [debounced, role, emailDomain]);

	const options = users.map((user) => ({
		value: `${user.id}:${user.name || user.email}`,
		label: `${user.email}`,
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
					setInputValue(selectedUser.name || selectedUser.email || '');
					onChange?.(selectedUser);
				}
			}}
			data={options}
			renderOption={({ option }) => {
				const userId = option.value.split(':')[0];
				const user = users.find((u) => u.id === userId);
				return (
					<Group gap='sm' wrap='nowrap'>
						<Avatar src={user?.image} size='sm' radius='xl'>
							{user?.name?.charAt(0)?.toUpperCase()}
						</Avatar>
						<Stack gap={0}>
							<Text size='sm' fw={500}>
								{user?.name || 'Unnamed User'}
							</Text>
							<Text size='xs' c='dimmed'>
								{user?.email}
							</Text>
						</Stack>
					</Group>
				);
			}}
			rightSection={isSearching ? <Loader size='xs' /> : null}
			error={error}
			{...props}
		/>
	);
}
