'use client';

import { Button, Group, Stack, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';

type FormValues = {
	text: string;
	description: string;
};

type Props = {
	initialValues?: FormValues;
	onSubmit: (values: FormValues) => void;
	loading?: boolean;
	submitLabel: string;
	onCancel: () => void;
};

export default function CriterionForm({
	initialValues,
	onSubmit,
	loading,
	submitLabel,
	onCancel,
}: Props) {
	const form = useForm<FormValues>({
		initialValues: initialValues ?? {
			text: '',
			description: '',
		},
		validate: {
			text: (v) => (!v.trim() ? 'Criterion text is required' : null),
		},
	});

	return (
		<form onSubmit={form.onSubmit(onSubmit)}>
			<Stack>
				<TextInput
					label='Criterion'
					placeholder='Enter criterion text...'
					{...form.getInputProps('text')}
				/>
				<Textarea
					label='Description'
					placeholder='Guidance text for the observer (optional)'
					autosize
					minRows={3}
					{...form.getInputProps('description')}
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
