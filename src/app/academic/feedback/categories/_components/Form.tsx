'use client';

import { feedbackCategories } from '@academic/_database';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/shared/ui/adease';

type Category = typeof feedbackCategories.$inferInsert;

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
			queryKey={['feedback-categories']}
			schema={createInsertSchema(feedbackCategories)}
			defaultValues={defaultValues}
			onSuccess={({ id }) => {
				router.push(`/academic/feedback/categories/${id}`);
			}}
		>
			{(form) => <TextInput label='Name' {...form.getInputProps('name')} />}
		</Form>
	);
}
