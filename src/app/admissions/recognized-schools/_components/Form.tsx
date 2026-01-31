'use client';

import { recognizedSchools } from '@admissions/_database';
import { Switch, TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/shared/ui/adease';

type RecognizedSchool = typeof recognizedSchools.$inferInsert;

type Props = {
	onSubmit: (values: RecognizedSchool) => Promise<RecognizedSchool>;
	defaultValues?: RecognizedSchool;
	title?: string;
};

export default function RecognizedSchoolForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['recognized-schools']}
			schema={createInsertSchema(recognizedSchools)}
			defaultValues={defaultValues}
			onSuccess={({ id }) =>
				router.push(`/admissions/recognized-schools/${id}`)
			}
		>
			{(form) => (
				<>
					<TextInput label='Name' {...form.getInputProps('name')} />
					<Switch
						label='Active'
						{...form.getInputProps('isActive', { type: 'checkbox' })}
					/>
				</>
			)}
		</Form>
	);
}
