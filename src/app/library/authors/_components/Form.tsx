'use client';

import { authors } from '@library/_database';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/shared/ui/adease';

type Author = typeof authors.$inferInsert;

type Props = {
	onSubmit: (values: Author) => Promise<Author>;
	defaultValues?: Author;
	title?: string;
};

export default function AuthorForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['authors']}
			schema={createInsertSchema(authors)}
			defaultValues={defaultValues}
			onSuccess={({ id }) => router.push(`/library/authors/${id}`)}
		>
			{(form) => (
				<TextInput label='Name' {...form.getInputProps('name')} required />
			)}
		</Form>
	);
}
