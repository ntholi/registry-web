'use client';

import { getAllSchools } from '@academic/schools';
import { MultiSelect, NumberInput, Select, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getAllVenueTypes } from '@timetable/venue-types';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { venues } from '@/modules/timetable/database';
import { useUserSchools } from '@/shared/lib/hooks/use-user-schools';
import { Form } from '@/shared/ui/adease';

type Venue = typeof venues.$inferInsert & { schoolIds?: number[] };

type Props = {
	onSubmit: (values: Venue) => Promise<Venue>;
	defaultValues?: Partial<Venue>;
	title?: string;
};

export default function VenueForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();

	const { data: venueTypes = [] } = useQuery({
		queryKey: ['venue-types'],
		queryFn: getAllVenueTypes,
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
			queryKey={['venues']}
			schema={createInsertSchema(venues).extend({
				schoolIds: createInsertSchema(venues).shape.typeId.array(),
			})}
			key={formKey}
			defaultValues={computedDefaultValues}
			onSuccess={({ id }) => {
				router.push(`/venues/${id}`);
			}}
		>
			{(form) => (
				<>
					<TextInput label='Name' {...form.getInputProps('name')} />
					<NumberInput label='Capacity' {...form.getInputProps('capacity')} />
					<Select
						label='Venue Type'
						data={venueTypes.map((vt: { id: number; name: string }) => ({
							value: String(vt.id),
							label: vt.name,
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
