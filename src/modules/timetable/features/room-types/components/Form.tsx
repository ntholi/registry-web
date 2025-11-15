'use client';

import { Textarea, TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { roomTypes } from '@/core/database/schema';
import { Form } from '@/shared/ui/adease';

type RoomType = typeof roomTypes.$inferInsert;

type Props = {
	onSubmit: (values: RoomType) => Promise<RoomType>;
	defaultValues?: RoomType;
	title?: string;
};

export default function RoomTypeForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['room-types']}
			schema={createInsertSchema(roomTypes)}
			defaultValues={defaultValues}
			onSuccess={({ id }) => {
				router.push(`/room-types/${id}`);
			}}
		>
			{(form) => (
				<>
					<TextInput label='Name' {...form.getInputProps('name')} />
					<Textarea
						label='Description'
						{...form.getInputProps('description')}
					/>
				</>
			)}
		</Form>
	);
}
