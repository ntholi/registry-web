'use client';

import { sponsors } from '@finance/_database';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import type { ActionResult } from '@/shared/lib/actions/actionResult';
import { Form } from '@/shared/ui/adease';

type Sponsor = typeof sponsors.$inferInsert;
type SponsorRecord = typeof sponsors.$inferSelect;

type Props = {
	onSubmit: (
		values: Sponsor
	) => Promise<SponsorRecord | ActionResult<SponsorRecord>>;
	defaultValues?: Sponsor;
	onSuccess?: (value: SponsorRecord) => void;
	onError?: (
		error: Error | React.SyntheticEvent<HTMLDivElement, Event>
	) => void;
	title?: string;
};

export default function SponsorForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();

	return (
		<Form<Sponsor, Sponsor | undefined, SponsorRecord>
			title={title}
			action={onSubmit}
			queryKey={['sponsors']}
			schema={createInsertSchema(sponsors)}
			defaultValues={defaultValues}
			onSuccess={({ id }) => {
				router.push(`/finance/sponsors/${id}`);
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
