'use client';

import { getAllSchools } from '@academic/schools';
import { MultiSelect, NumberInput, Select, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getAllRoomTypes } from '@timetable/room-types';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { rooms } from '@/modules/timetable/database';
import { useUserSchools } from '@/shared/lib/hooks/use-user-schools';
import { Form } from '@/shared/ui/adease';

type Room = typeof rooms.$inferInsert & { schoolIds?: number[] };

type Props = {
	onSubmit: (values: Room) => Promise<Room>;
	defaultValues?: Partial<Room>;
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

	const schools = schoolsData || [];

	const { userSchools } = useUserSchools();
	const userSchoolIds =
		userSchools?.map((us: { schoolId: number }) => us.schoolId) || [];

	const computedDefaultValues = {
		...(defaultValues || {}),
		schoolIds: defaultValues?.schoolIds ?? userSchoolIds,
	};
	const formKey = JSON.stringify(computedDefaultValues || {});

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['rooms']}
			schema={createInsertSchema(rooms).extend({
				schoolIds: createInsertSchema(rooms).shape.typeId.array(),
			})}
			key={formKey}
			defaultValues={computedDefaultValues}
			onSuccess={({ id }) => {
				router.push(`/rooms/${id}`);
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
						data={schools.map((s: { id: number; name: string }) => ({
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
