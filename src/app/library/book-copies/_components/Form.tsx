'use client';

import { bookCondition, bookCopies } from '@library/_database';
import { Select, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/shared/ui/adease';

type BookCopy = typeof bookCopies.$inferInsert;

type Props = {
	bookId: number;
	onSubmit: (values: BookCopy) => Promise<BookCopy>;
	defaultValues?: BookCopy;
	title?: string;
	returnPath: string;
};

export default function BookCopyForm({
	bookId,
	onSubmit,
	defaultValues,
	title,
	returnPath,
}: Props) {
	const router = useRouter();
	const conditionOptions = bookCondition.enumValues.map((v) => ({
		value: v,
		label: v,
	}));

	return (
		<Form
			title={title}
			action={async (values) =>
				onSubmit({ ...values, bookId } as typeof bookCopies.$inferInsert)
			}
			queryKey={['book-copies', String(bookId)]}
			schema={createInsertSchema(bookCopies).omit({ bookId: true })}
			defaultValues={defaultValues}
			onSuccess={() => router.push(returnPath)}
		>
			{(form) => (
				<>
					<TextInput
						label='Serial Number'
						{...form.getInputProps('serialNumber')}
						required
					/>
					<Select
						label='Condition'
						data={conditionOptions}
						{...form.getInputProps('condition')}
					/>
					<TextInput label='Location' {...form.getInputProps('location')} />
					<DateInput
						label='Acquired Date'
						{...form.getInputProps('acquiredAt')}
						valueFormat='YYYY-MM-DD'
					/>
				</>
			)}
		</Form>
	);
}
