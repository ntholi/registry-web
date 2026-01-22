'use client';

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
import {
	createCategory,
	getAllCategories,
} from '../../categories/_server/actions';

type Props = {
	value: string[];
	onChange: (value: string[]) => void;
};

export default function CategoriesSelect({ value, onChange }: Props) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [newCategory, setNewCategory] = useState('');
	const [loading, setLoading] = useState(false);

	const { data: categoriesData } = useQuery({
		queryKey: ['categories', 'all'],
		queryFn: getAllCategories,
	});

	const options =
		categoriesData?.map((c) => ({ value: String(c.id), label: c.name })) ?? [];

	async function handleAddCategory() {
		if (!newCategory.trim()) return;
		setLoading(true);
		const created = await createCategory({ name: newCategory.trim() });
		await queryClient.invalidateQueries({ queryKey: ['categories', 'all'] });
		onChange([...value, String(created.id)]);
		setNewCategory('');
		setLoading(false);
		close();
	}

	return (
		<>
			<Group gap='xs' align='flex-end'>
				<MultiSelect
					label='Categories'
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
					title='Add category'
				>
					<IconPlus size={18} />
				</ActionIcon>
			</Group>
			<Modal opened={opened} onClose={close} title='Add Category' centered>
				<TextInput
					label='Category Name'
					value={newCategory}
					onChange={(e) => setNewCategory(e.currentTarget.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							handleAddCategory();
						}
					}}
					autoFocus
				/>
				<Group justify='flex-end' mt='md'>
					<Button
						variant='filled'
						color='blue'
						onClick={handleAddCategory}
						loading={loading}
						disabled={!newCategory.trim()}
					>
						Save
					</Button>
				</Group>
			</Modal>
		</>
	);
}
