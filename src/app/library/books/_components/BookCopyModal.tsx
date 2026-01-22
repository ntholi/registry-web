'use client';

import { bookCondition, bookCopies } from '@library/_database';
import {
	createBookCopy,
	updateBookCopy,
} from '@library/book-copies/_server/actions';
import {
	ActionIcon,
	Button,
	Modal,
	Select,
	Stack,
	TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';

type BookCopy = typeof bookCopies.$inferInsert;

type Props = {
	bookId: number;
	copy?: BookCopy & { id: number };
};

const schema = createInsertSchema(bookCopies).omit({
	bookId: true,
	status: true,
});

export default function BookCopyModal({ bookId, copy }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();
	const isEdit = !!copy;

	const conditionOptions = bookCondition.enumValues.map((v) => ({
		value: v,
		label: v,
	}));

	const form = useForm({
		initialValues: {
			serialNumber: copy?.serialNumber ?? '',
			condition: copy?.condition ?? 'Good',
			location: copy?.location ?? '',
			acquiredAt: copy?.acquiredAt ?? null,
		},
		validate: zodResolver(schema),
	});

	const mutation = useMutation({
		mutationFn: async (values: typeof form.values) => {
			const data = { ...values, bookId } as BookCopy;
			if (isEdit && copy) {
				return updateBookCopy(copy.id, data);
			}
			return createBookCopy(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['book-copies', String(bookId)],
			});
			notifications.show({
				title: 'Success',
				message: isEdit
					? 'Copy updated successfully'
					: 'Copy added successfully',
				color: 'green',
			});
			handleClose();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	function handleClose() {
		close();
		if (!isEdit) {
			form.reset();
		}
	}

	function handleSubmit(values: typeof form.values) {
		mutation.mutate(values);
	}

	return (
		<>
			{isEdit ? (
				<ActionIcon size='sm' variant='subtle' color='gray' onClick={open}>
					<IconEdit size='1rem' />
				</ActionIcon>
			) : (
				<Button
					onClick={open}
					variant='light'
					leftSection={<IconPlus size={16} />}
					size='xs'
				>
					Add Copy
				</Button>
			)}

			<Modal
				opened={opened}
				onClose={handleClose}
				title={isEdit ? 'Edit Copy' : 'Add Copy'}
			>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Stack>
						<TextInput
							label='Serial Number'
							placeholder='Enter serial number'
							required
							{...form.getInputProps('serialNumber')}
						/>
						<Select
							label='Condition'
							data={conditionOptions}
							{...form.getInputProps('condition')}
						/>
						<TextInput
							label='Location'
							placeholder='e.g., Shelf A-12'
							{...form.getInputProps('location')}
						/>
						<DateInput
							label='Acquired Date'
							valueFormat='YYYY-MM-DD'
							clearable
							{...form.getInputProps('acquiredAt')}
						/>
						<Button type='submit' loading={mutation.isPending}>
							{isEdit ? 'Update' : 'Add'}
						</Button>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
