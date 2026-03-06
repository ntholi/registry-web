'use client';

import { DateInput } from '@mantine/dates';
import { graduationDates } from '@registry/_database';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { formatDateToISO, parseDate } from '@/shared/lib/utils/dates';
import { Form } from '@/shared/ui/adease';
import TermInput from '@/shared/ui/TermInput';

type Graduation = typeof graduationDates.$inferInsert;

type TermOption = {
	id: number;
	code: string;
};

type Props = {
	onSubmit: (values: Graduation) => Promise<Graduation>;
	defaultValues?: Graduation;
	terms: TermOption[];
	title?: string;
};

export default function GraduationForm({
	onSubmit,
	defaultValues,
	terms,
	title,
}: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['graduations']}
			schema={createInsertSchema(graduationDates)}
			defaultValues={defaultValues}
			onSuccess={({ date }) => {
				router.push(`/registry/graduation/dates/${date}`);
			}}
		>
			{(form) => (
				<>
					<DateInput
						label='Graduation Date'
						value={parseDate(form.values.date)}
						onChange={(d) => form.setFieldValue('date', formatDateToISO(d))}
						error={form.errors.date}
						required
					/>
					<TermInput
						terms={terms}
						value={form.values.termId}
						onChange={(value) => {
							if (typeof value === 'number') {
								form.setFieldValue('termId', value);
							}
						}}
						error={form.errors.termId}
						required
					/>
				</>
			)}
		</Form>
	);
}
