'use client';

import { recognizedSchools } from '@admissions/_database';
import { Switch, TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import type { ActionResult } from '@/shared/lib/actions/actionResult';
import { Form } from '@/shared/ui/adease';

type RecognizedSchoolInput = typeof recognizedSchools.$inferInsert;
type RecognizedSchool = typeof recognizedSchools.$inferSelect;

type Props = {
	onSubmit: (
		values: RecognizedSchoolInput
	) => Promise<RecognizedSchool | ActionResult<RecognizedSchool>>;
	defaultValues?: Partial<RecognizedSchoolInput>;
	title?: string;
};

export default function RecognizedSchoolForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();
	const initialValues: RecognizedSchoolInput = {
		name: defaultValues?.name ?? '',
		isActive: defaultValues?.isActive ?? true,
	};

	return (
		<Form<RecognizedSchoolInput, RecognizedSchoolInput, RecognizedSchool>
			title={title}
			action={onSubmit}
			queryKey={['recognized-schools']}
			schema={createInsertSchema(recognizedSchools)}
			defaultValues={initialValues}
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
