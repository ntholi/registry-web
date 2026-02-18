'use client';

import { Button, Group, Select, Stack, Switch, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
	createCategory,
	getAllCategories,
} from '../../categories/_server/actions';

type FormValues = {
	categoryId: string;
	text: string;
	active: boolean;
};

type Props = {
	initialValues?: FormValues;
	onSubmit: (values: {
		categoryId: number;
		text: string;
		active: boolean;
	}) => void;
	loading?: boolean;
	submitLabel: string;
	onCancel: () => void;
};

export default function QuestionForm({
	initialValues,
	onSubmit,
	loading,
	submitLabel,
	onCancel,
}: Props) {
	const [newCategory, setNewCategory] = useState('');

	const { data: categories = [], refetch } = useQuery({
		queryKey: ['feedback-categories-all'],
		queryFn: () => getAllCategories(),
	});

	const categoryOptions = [
		...categories.map((c) => ({
			value: String(c.id),
			label: c.name,
		})),
		...(newCategory
			? [{ value: `new:${newCategory}`, label: `+ Create "${newCategory}"` }]
			: []),
	];

	const form = useForm<FormValues>({
		initialValues: initialValues ?? {
			categoryId: '',
			text: '',
			active: true,
		},
		validate: {
			categoryId: (v) => (!v ? 'Category is required' : null),
			text: (v) => (!v.trim() ? 'Question text is required' : null),
		},
	});

	async function handleSubmit(values: FormValues) {
		let categoryId: number;

		if (values.categoryId.startsWith('new:')) {
			const name = values.categoryId.replace('new:', '');
			const created = await createCategory({ name });
			categoryId = created.id;
			await refetch();
		} else {
			categoryId = Number(values.categoryId);
		}

		onSubmit({ categoryId, text: values.text, active: values.active });
	}

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<Stack>
				<Select
					label='Category'
					placeholder='Select or type to create'
					data={categoryOptions}
					searchable
					nothingFoundMessage={
						newCategory
							? `Select "+ Create" option above`
							: 'Type to search or create'
					}
					onSearchChange={(val) => {
						const exists = categories.some(
							(c) => c.name.toLowerCase() === val.toLowerCase()
						);
						setNewCategory(exists ? '' : val);
					}}
					{...form.getInputProps('categoryId')}
				/>
				<Textarea
					label='Question Text'
					placeholder='Enter the feedback question...'
					minRows={3}
					autosize
					{...form.getInputProps('text')}
				/>
				<Switch
					label='Active'
					{...form.getInputProps('active', { type: 'checkbox' })}
				/>
				<Group justify='flex-end'>
					<Button variant='default' onClick={onCancel}>
						Cancel
					</Button>
					<Button type='submit' loading={loading}>
						{submitLabel}
					</Button>
				</Group>
			</Stack>
		</form>
	);
}
