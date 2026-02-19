'use client';

import { feedbackCycles } from '@academic/_database';
import { MultiSelect, Select, SimpleGrid, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useSession } from 'next-auth/react';
import { useRouter } from 'nextjs-toploader/app';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';
import { formatDateToISO, formatMonthYear } from '@/shared/lib/utils/dates';
import { Form } from '@/shared/ui/adease';
import { getSchools, getSchoolsForUser, getTerms } from '../_server/actions';

type Cycle = typeof feedbackCycles.$inferInsert;
type CycleWithSchools = Cycle & { schoolIds?: number[] };

type Props = {
	onSubmit: (values: CycleWithSchools) => Promise<Cycle>;
	defaultValues?: CycleWithSchools;
	title?: string;
};

const defaultName = formatMonthYear(new Date());

export default function CycleForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();
	const { data: session } = useSession();
	const { activeTerm } = useActiveTerm();
	const values =
		defaultValues ?? ({ name: defaultName, termId: activeTerm?.id } as Cycle);
	const { data: terms = [] } = useQuery({
		queryKey: ['terms'],
		queryFn: () => getTerms(),
	});
	const { data: schools = [] } = useQuery({
		queryKey: ['schools'],
		queryFn: () => getSchools(),
	});
	const { data: userSchools, isLoading: loadingUserSchools } = useQuery({
		queryKey: ['user-schools', session?.user?.id],
		queryFn: () => getSchoolsForUser(session?.user?.id),
		enabled: !!session?.user?.id,
	});

	const defaultSchoolIds = defaultValues?.schoolIds
		? defaultValues.schoolIds.map(String)
		: userSchools
			? userSchools.map((us: { schoolId: number }) => String(us.schoolId))
			: [];

	const formKey = defaultValues
		? undefined
		: `${activeTerm?.id ?? ''}-${defaultSchoolIds.join(',')}`;

	if (!defaultValues && loadingUserSchools) return null;

	return (
		<Form
			key={formKey}
			title={title}
			action={onSubmit}
			queryKey={['feedback-cycles']}
			schema={createInsertSchema(feedbackCycles)}
			defaultValues={{ ...values, schoolIds: defaultSchoolIds.map(Number) }}
			onSuccess={({ id }) => {
				router.push(`/academic/feedback/cycles/${id}`);
			}}
		>
			{(form) => (
				<>
					<TextInput label='Name' {...form.getInputProps('name')} />
					<Select
						label='Term'
						data={terms.map((t) => ({
							value: String(t.id),
							label: t.code,
						}))}
						value={form.values.termId ? String(form.values.termId) : null}
						onChange={(val) =>
							form.setFieldValue('termId', val ? Number(val) : (null as never))
						}
						error={form.errors.termId}
						searchable
					/>

					<SimpleGrid cols={{ base: 1, sm: 2 }}>
						<DateInput
							label='Start Date'
							value={form.values.startDate}
							onChange={(date) =>
								form.setFieldValue('startDate', formatDateToISO(date))
							}
							error={form.errors.startDate}
						/>
						<DateInput
							label='End Date'
							value={form.values.endDate}
							onChange={(date) =>
								form.setFieldValue('endDate', formatDateToISO(date))
							}
							error={form.errors.endDate}
						/>
					</SimpleGrid>
					<MultiSelect
						label='Schools'
						data={schools.map((s) => ({
							value: String(s.id),
							label: s.name,
						}))}
						value={
							form.values.schoolIds
								? (form.values.schoolIds as number[]).map(String)
								: []
						}
						onChange={(vals) =>
							form.setFieldValue(
								'schoolIds' as never,
								vals.map(Number) as never
							)
						}
						searchable
						clearable
					/>
				</>
			)}
		</Form>
	);
}
