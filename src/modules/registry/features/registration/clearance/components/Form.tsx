'use client';

import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { clearance } from '@/modules/registry/database';
import { Form } from '@/shared/ui/adease';

type Clearance = typeof clearance.$inferInsert;

type Props = {
	onSubmit: (values: Clearance) => Promise<Clearance>;
	status: 'pending' | 'approved' | 'rejected';
	defaultValues?: Clearance;
	onSuccess?: (value: Clearance) => void;
	onError?: (
		error: Error | React.SyntheticEvent<HTMLDivElement, Event>
	) => void;
	title?: string;
};

export default function ClearanceForm({
	onSubmit,
	status,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['clearances']}
			schema={createInsertSchema(clearance)}
			defaultValues={defaultValues}
			onSuccess={({ id }) => {
				router.push(`/clearance/${status}/${id}`);
			}}
		>
			{(form) => (
				<>
					<TextInput label='Department' {...form.getInputProps('department')} />
					<TextInput label='Status' {...form.getInputProps('status')} />
					<TextInput label='Message' {...form.getInputProps('message')} />
					<TextInput
						label='Responded By'
						{...form.getInputProps('respondedBy')}
					/>
				</>
			)}
		</Form>
	);
}
