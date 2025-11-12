'use client';

import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/components/adease';
import { sponsors } from '@/shared/db/schema';

type Sponsor = typeof sponsors.$inferInsert;

type Props = {
	onSubmit: (values: Sponsor) => Promise<Sponsor>;
	defaultValues?: Sponsor;
	onSuccess?: (value: Sponsor) => void;
	onError?: (
		error: Error | React.SyntheticEvent<HTMLDivElement, Event>
	) => void;
	title?: string;
};

export default function SponsorForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['sponsors']}
			schema={createInsertSchema(sponsors)}
			defaultValues={defaultValues}
			onSuccess={({ id }) => {
				router.push(`/sponsors/${id}`);
			}}
		>
			{(form) => (
				<>
					<TextInput label='Name' {...form.getInputProps('name')} />
					<TextInput label='Code' {...form.getInputProps('code')} />
				</>
			)}
		</Form>
	);
}
