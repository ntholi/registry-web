'use client';

import { Textarea, TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { venueTypes } from '@/modules/timetable/database';
import { Form } from '@/shared/ui/adease';

type VenueType = typeof venueTypes.$inferInsert;

type Props = {
	onSubmit: (values: VenueType) => Promise<VenueType>;
	defaultValues?: VenueType;
	title?: string;
};

export default function VenueTypeForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['venue-types']}
			schema={createInsertSchema(venueTypes)}
			defaultValues={defaultValues}
			onSuccess={({ id }) => {
				router.push(`/timetable/venue-types/${id}`);
			}}
		>
			{(form) => (
				<>
					<TextInput label='Name' {...form.getInputProps('name')} required />
					<Textarea
						label='Description'
						{...form.getInputProps('description')}
						rows={4}
					/>
				</>
			)}
		</Form>
	);
}
