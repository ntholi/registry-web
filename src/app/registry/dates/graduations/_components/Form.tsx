'use client';

import { Select } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { graduations } from '@registry/_database';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/shared/ui/adease';

type Graduation = typeof graduations.$inferInsert;

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

function formatDate(date: Date | string | null): string {
	if (!date) return '';
	if (typeof date === 'string') return date;
	return date.toISOString().split('T')[0];
}

function parseDate(dateStr: string | undefined): Date | undefined {
	if (!dateStr) return undefined;
	return new Date(dateStr);
}

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
			schema={createInsertSchema(graduations)}
			defaultValues={defaultValues}
			onSuccess={({ graduationDate }) => {
				router.push(`/registry/dates/graduations/${graduationDate}`);
			}}
		>
			{(form) => (
				<>
					<DateInput
						label='Graduation Date'
						valueFormat='YYYY-MM-DD'
						value={parseDate(form.values.graduationDate)}
						onChange={(date) =>
							form.setFieldValue('graduationDate', formatDate(date))
						}
						error={form.errors.graduationDate}
						required
					/>
					<Select
						label='Term'
						data={terms.map((t) => ({
							value: String(t.id),
							label: t.code,
						}))}
						value={form.values.termId ? String(form.values.termId) : null}
						onChange={(value) => {
							if (value) {
								form.setFieldValue('termId', Number(value));
							}
						}}
						error={form.errors.termId}
						required
						searchable
					/>
				</>
			)}
		</Form>
	);
}
