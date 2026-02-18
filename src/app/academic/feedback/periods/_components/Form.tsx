'use client';

import { feedbackPeriods } from '@academic/_database';
import { Select, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { formatDateToISO } from '@/shared/lib/utils/dates';
import { Form } from '@/shared/ui/adease';
import { getTerms } from '../_server/actions';

type Period = typeof feedbackPeriods.$inferInsert;

type Props = {
	onSubmit: (values: Period) => Promise<Period>;
	defaultValues?: Period;
	title?: string;
};

export default function PeriodForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();
	const { data: terms = [] } = useQuery({
		queryKey: ['terms'],
		queryFn: () => getTerms(),
	});

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['feedback-periods']}
			schema={createInsertSchema(feedbackPeriods)}
			defaultValues={defaultValues}
			onSuccess={({ id }) => {
				router.push(`/academic/feedback/periods/${id}`);
			}}
		>
			{(form) => (
				<>
					<TextInput label='Name' {...form.getInputProps('name')} />
					<Select
						label='Term'
						data={terms.map((t) => ({
							value: String(t.id),
							label: `${t.code}${t.name ? ` — ${t.name}` : ''}`,
						}))}
						value={form.values.termId ? String(form.values.termId) : null}
						onChange={(val) =>
							form.setFieldValue('termId', val ? Number(val) : (null as never))
						}
						error={form.errors.termId}
						searchable
					/>
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
				</>
			)}
		</Form>
	);
}
