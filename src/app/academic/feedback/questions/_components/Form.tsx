'use client';

import { feedbackQuestions } from '@academic/_database';
import { Select, Switch, Textarea } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/shared/ui/adease';
import { getAllCategories } from '../../categories/_server/actions';

type Question = typeof feedbackQuestions.$inferInsert;

type Props = {
	onSubmit: (values: Question) => Promise<Question>;
	defaultValues?: Question;
	title?: string;
};

export default function QuestionForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();

	const { data: categories = [] } = useQuery({
		queryKey: ['feedback-categories-all'],
		queryFn: () => getAllCategories(),
	});

	const categoryOptions = categories.map((c) => ({
		value: String(c.id),
		label: c.name,
	}));

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['feedback-questions']}
			schema={createInsertSchema(feedbackQuestions)}
			defaultValues={defaultValues}
			onSuccess={({ id }) => {
				router.push(`/academic/feedback/questions/${id}`);
			}}
		>
			{(form) => (
				<>
					<Select
						label='Category'
						data={categoryOptions}
						searchable
						{...form.getInputProps('categoryId')}
						value={form.values.categoryId?.toString()}
						onChange={(val) => {
							if (val) form.setFieldValue('categoryId', Number(val));
						}}
					/>
					<Textarea label='Question' {...form.getInputProps('text')} />
					<Switch
						label='Active'
						{...form.getInputProps('active', { type: 'checkbox' })}
					/>
				</>
			)}
		</Form>
	);
}
