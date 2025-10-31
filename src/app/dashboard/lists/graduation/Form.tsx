'use client';

import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';
import { Form } from '@/components/adease';
import { graduationLists } from '@/db/schema';

type GraduationList = typeof graduationLists.$inferInsert;

type Props = {
	onSubmit: (values: GraduationList) => Promise<GraduationList>;
	defaultValues?: GraduationList;
	onSuccess?: (value: GraduationList) => void;
	onError?: (error: Error | React.SyntheticEvent<HTMLDivElement, Event>) => void;
	title?: string;
};

export default function GraduationListForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['graduation-lists']}
			schema={createInsertSchema(graduationLists)}
			defaultValues={defaultValues}
			onSuccess={({ id }) => {
				router.push(`/dashboard/lists/graduation/${id}`);
			}}
		>
			{(form) => (
				<>
					<TextInput label='Name' {...form.getInputProps('name')} />
				</>
			)}
		</Form>
	);
}
