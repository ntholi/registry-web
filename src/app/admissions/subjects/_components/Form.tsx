'use client';

import { subjects } from '@admissions/_database';
import { Switch, TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { z } from 'zod';
import { Form } from '@/shared/ui/adease';
import type { Subject } from '../_lib/types';

type Props = {
	onSubmit: (values: Subject) => Promise<Subject>;
	defaultValues?: Subject;
	title?: string;
};

export default function SubjectForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();

	const schema = z.object({
		...createInsertSchema(subjects).shape,
		name: z.string().min(1, 'Name is required'),
	});

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['subjects']}
			schema={schema}
			defaultValues={defaultValues ?? { isActive: true }}
			onSuccess={({ id }) => router.push(`/admissions/subjects/${id}`)}
		>
			{(form) => (
				<>
					<TextInput
						label='Name'
						placeholder='e.g., Mathematics'
						required
						{...form.getInputProps('name')}
					/>
					<Switch
						label='Active'
						{...form.getInputProps('isActive', { type: 'checkbox' })}
					/>
				</>
			)}
		</Form>
	);
}
