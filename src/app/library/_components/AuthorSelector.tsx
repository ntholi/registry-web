'use client';

import {
	getAllAuthors,
	getOrCreateAuthors,
} from '@library/authors/_server/actions';
import {
	ActionIcon,
	Button,
	Group,
	Modal,
	MultiSelect,
	TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

type Props = {
	value: string[];
	onChange: (value: string[]) => void;
};

export default function AuthorSelector({ value, onChange }: Props) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [newAuthor, setNewAuthor] = useState('');
	const [loading, setLoading] = useState(false);

	const { data: authorsData } = useQuery({
		queryKey: ['authors', 'all'],
		queryFn: getAllAuthors,
	});

	const options =
		authorsData?.map((a) => ({ value: a.id, label: a.name })) ?? [];

	async function handleAddAuthor() {
		const name = newAuthor.trim();
		if (!name) return;

		setLoading(true);

		const [created] = await getOrCreateAuthors([name]);
		if (created) {
			await queryClient.invalidateQueries({ queryKey: ['authors', 'all'] });
			if (!value.includes(created.id)) {
				onChange([...value, created.id]);
			}
		}

		setNewAuthor('');
		setLoading(false);
		close();
	}

	return (
		<>
			<Group gap='xs' align='flex-end'>
				<MultiSelect
					label='Authors'
					data={options}
					value={value}
					onChange={onChange}
					searchable
					style={{ flex: 1 }}
				/>
				<ActionIcon
					variant='light'
					size='lg'
					mb={2}
					onClick={open}
					title='Add author'
				>
					<IconPlus size={18} />
				</ActionIcon>
			</Group>
			<Modal opened={opened} onClose={close} title='Add Author' centered>
				<TextInput
					label='Author Name'
					value={newAuthor}
					onChange={(e) => setNewAuthor(e.currentTarget.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							handleAddAuthor();
						}
					}}
					autoFocus
				/>
				<Group justify='flex-end' mt='md'>
					<Button
						variant='filled'
						color='blue'
						onClick={handleAddAuthor}
						loading={loading}
						disabled={!newAuthor.trim()}
					>
						Save
					</Button>
				</Group>
			</Modal>
		</>
	);
}
