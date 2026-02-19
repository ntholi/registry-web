'use client';

import { feedbackCycles } from '@academic/_database';
import { Select, SimpleGrid, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';
import { formatDateToISO, formatMonthYear } from '@/shared/lib/utils/dates';
import { Form } from '@/shared/ui/adease';
import { getTerms } from '../_server/actions';

type Cycle = typeof feedbackCycles.$inferInsert;

type Props = {
	onSubmit: (values: Cycle) => Promise<Cycle>;
	defaultValues?: Cycle;
	title?: string;
};

const defaultName = formatMonthYear(new Date());

export default function CycleForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();
	const { activeTerm } = useActiveTerm();
	const values =
		defaultValues ?? ({ name: defaultName, termId: activeTerm?.id } as Cycle);
	const { data: terms = [] } = useQuery({
		queryKey: ['terms'],
		queryFn: () => getTerms(),
	});

	return (
		<Form
			key={defaultValues ? undefined : String(activeTerm?.id ?? '')}
			title={title}
			action={onSubmit}
			queryKey={['feedback-cycles']}
			schema={createInsertSchema(feedbackCycles)}
			defaultValues={values}
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
				</>
			)}
		</Form>
	);
}
