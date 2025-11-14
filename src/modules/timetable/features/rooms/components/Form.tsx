'use client';

import { MultiSelect, NumberInput, Select, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { rooms } from '@/core/database/schema';
import { getAllSchools } from '@/modules/academic/features/schools';
import { getAllRoomTypes } from '@/modules/timetable/features/room-types';
import { Form } from '@/shared/ui/adease';

type Room = typeof rooms.$inferInsert;
type RoomFormValues = Room & { schoolIds: number[] };

type Props = {
	// biome-ignore lint/suspicious/noExplicitAny: Form handler can return different types
	onSubmit: (values: RoomFormValues) => Promise<any>;
	defaultValues?: Partial<RoomFormValues>;
	title?: string;
};

export default function RoomForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();

	const { data: roomTypes = [] } = useQuery({
		queryKey: ['room-types'],
		queryFn: getAllRoomTypes,
	});

	const { data: schoolsData } = useQuery({
		queryKey: ['schools'],
		queryFn: getAllSchools,
	});

	const schools = schoolsData?.items || [];

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['rooms']}
			schema={createInsertSchema(rooms).extend({
				schoolIds: createInsertSchema(rooms).shape.typeId.array(),
			})}
			defaultValues={defaultValues}
			onSuccess={({ id }) => {
				router.push(`/timetable/rooms/${id}`);
			}}
		>
			{(form) => (
				<>
					<TextInput label='Name' {...form.getInputProps('name')} />
					<NumberInput label='Capacity' {...form.getInputProps('capacity')} />
					<Select
						label='Room Type'
						data={roomTypes.map((rt: { id: number; name: string }) => ({
							value: String(rt.id),
							label: rt.name,
						}))}
						{...form.getInputProps('typeId')}
						onChange={(value) => {
							form.setFieldValue('typeId', Number(value));
						}}
						value={String(form.values.typeId || '')}
					/>
					<MultiSelect
						label='Schools'
						data={schools.map((s) => ({
							value: String(s.id),
							label: s.name,
						}))}
						{...form.getInputProps('schoolIds')}
						onChange={(values) => {
							form.setFieldValue(
								'schoolIds',
								values.map((v) => Number(v))
							);
						}}
						value={form.values.schoolIds?.map((id) => String(id)) || []}
					/>
				</>
			)}
		</Form>
	);
}
