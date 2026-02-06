'use client';

import { categories } from '@library/_database';
import { Stack, Textarea, TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/shared/ui/adease';

type Category = typeof categories.$inferInsert;

type Props = {
	onSubmit: (values: Category) => Promise<Category>;
	defaultValues?: Category;
	title?: string;
};

export default function CategoryForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['categories']}
			schema={createInsertSchema(categories)}
			defaultValues={defaultValues}
			onSuccess={({ id }) => router.push(`/library/categories/${id}`)}
		>
			{(form) => (
				<Stack>
					<TextInput label='Name' {...form.getInputProps('name')} required />
					<Textarea
						label='Description'
						{...form.getInputProps('description')}
						autosize
						minRows={2}
						maxRows={4}
					/>
				</Stack>
			)}
		</Form>
	);
}
