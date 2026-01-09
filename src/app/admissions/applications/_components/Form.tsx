'use client';

import { getAllPrograms } from '@academic/schools/_server/actions';
import { applications } from '@admissions/_database';
import { Select, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { z } from 'zod';
import { Form } from '@/shared/ui/adease';
import { findAllApplicants } from '../../applicants/_server/actions';
import { findActiveIntakePeriods } from '../../intake-periods/_server/actions';
import type { Application } from '../_lib/types';

type Props = {
	onSubmit: (values: typeof applications.$inferInsert) => Promise<Application>;
	defaultValues?: Application;
	title?: string;
};

export default function ApplicationForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();

	const { data: applicantsData } = useQuery({
		queryKey: ['applicants', 'all'],
		queryFn: () => findAllApplicants(1, ''),
	});

	const { data: intakePeriodsData } = useQuery({
		queryKey: ['intake-periods', 'active'],
		queryFn: () => findActiveIntakePeriods(),
	});

	const { data: programsData } = useQuery({
		queryKey: ['programs', 'all'],
		queryFn: () => getAllPrograms(),
	});

	const applicantOptions =
		applicantsData?.items?.map((a) => ({
			value: a.id,
			label: `${a.fullName}${a.nationalId ? ` (${a.nationalId})` : ''}`,
		})) || [];

	const intakePeriodOptions =
		intakePeriodsData?.map((ip) => ({
			value: ip.id.toString(),
			label: `${ip.name} (${ip.startDate} - ${ip.endDate})`,
		})) || [];

	const programOptions =
		programsData?.map((p) => ({
			value: p.id.toString(),
			label: `${p.code} - ${p.name}`,
		})) || [];

	const schema = z.object({
		...createInsertSchema(applications).shape,
		applicantId: z.string().min(1, 'Applicant is required'),
		intakePeriodId: z.coerce.number().min(1, 'Intake period is required'),
		firstChoiceProgramId: z.coerce.number().min(1, 'First choice is required'),
		secondChoiceProgramId: z.coerce.number().optional().nullable(),
	});

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['applications']}
			schema={schema}
			defaultValues={
				defaultValues
					? {
							...defaultValues,
							intakePeriodId: defaultValues.intakePeriodId,
							firstChoiceProgramId: defaultValues.firstChoiceProgramId,
							secondChoiceProgramId: defaultValues.secondChoiceProgramId,
						}
					: undefined
			}
			onSuccess={({ id }) => router.push(`/admissions/applications/${id}`)}
		>
			{(form) => (
				<Stack>
					<Select
						label='Applicant'
						placeholder='Select applicant'
						data={applicantOptions}
						searchable
						required
						{...form.getInputProps('applicantId')}
					/>

					<Select
						label='Intake Period'
						placeholder='Select intake period'
						data={intakePeriodOptions}
						required
						value={form.values.intakePeriodId?.toString() || ''}
						onChange={(val) =>
							form.setFieldValue('intakePeriodId', val ? Number(val) : 0)
						}
						error={form.errors.intakePeriodId}
					/>

					{intakePeriodOptions.length === 0 && (
						<Text size='xs' c='orange'>
							No active intake periods available. Please create one first.
						</Text>
					)}

					<Select
						label='First Choice Program'
						placeholder='Select program'
						data={programOptions}
						searchable
						required
						value={form.values.firstChoiceProgramId?.toString() || ''}
						onChange={(val) =>
							form.setFieldValue('firstChoiceProgramId', val ? Number(val) : 0)
						}
						error={form.errors.firstChoiceProgramId}
					/>

					<Select
						label='Second Choice Program (Optional)'
						placeholder='Select program'
						data={programOptions}
						searchable
						clearable
						value={form.values.secondChoiceProgramId?.toString() || ''}
						onChange={(val) =>
							form.setFieldValue(
								'secondChoiceProgramId',
								val ? Number(val) : null
							)
						}
						error={form.errors.secondChoiceProgramId}
					/>
				</Stack>
			)}
		</Form>
	);
}
