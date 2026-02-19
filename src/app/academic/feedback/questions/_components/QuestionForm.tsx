'use client';

import { Button, Group, Stack, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';

type FormValues = {
	text: string;
};

type Props = {
	categoryId: string;
	initialValues?: FormValues;
	onSubmit: (values: { categoryId: string; text: string }) => void;
	loading?: boolean;
	submitLabel: string;
	onCancel: () => void;
};

export default function QuestionForm({
	categoryId,
	initialValues,
	onSubmit,
	loading,
	submitLabel,
	onCancel,
}: Props) {
	const form = useForm<FormValues>({
		initialValues: initialValues ?? {
			text: '',
		},
		validate: {
			text: (v) => (!v.trim() ? 'Question text is required' : null),
		},
	});

	async function handleSubmit(values: FormValues) {
		onSubmit({ categoryId, text: values.text });
	}

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<Stack>
				<Textarea
					label='Question Text'
					placeholder='Enter the feedback question...'
					minRows={3}
					autosize
					{...form.getInputProps('text')}
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
