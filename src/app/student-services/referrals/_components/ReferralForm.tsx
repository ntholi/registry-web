'use client';

import { Group, Select, Stack, Textarea, TextInput } from '@mantine/core';
import StudentPreviewCard from '@registry/_components/StudentPreviewCard';
import { getStudent } from '@registry/students/_server/actions';
import {
	studentReferralReason,
	studentReferrals,
} from '@student-services/_database';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import type { ActionResult } from '@/shared/lib/actions/actionResult';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { Form } from '@/shared/ui/adease';
import StudentInput from '@/shared/ui/StudentInput';

type Referral = typeof studentReferrals.$inferInsert;

type Props = {
	onSubmit: (values: Referral) => Promise<Referral | ActionResult<Referral>>;
	defaultValues?: Partial<Referral>;
	title?: string;
};

const reasonOptions = studentReferralReason.enumValues.map((r) => ({
	value: r,
	label: toTitleCase(r),
}));

export default function ReferralForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();
	const [stdNo, setStdNo] = useState<number | string>(
		defaultValues?.stdNo ?? ''
	);

	const { data: student } = useQuery({
		queryKey: ['student', stdNo],
		queryFn: () => getStudent(Number(stdNo)),
		enabled: !!stdNo && typeof stdNo === 'number',
	});

	return (
		<Form
			title={title}
			action={(values) =>
				onSubmit({ ...values, stdNo: Number(stdNo) } as Referral)
			}
			queryKey={['referrals']}
			schema={createInsertSchema(studentReferrals).omit({
				id: true,
				stdNo: true,
				status: true,
				referredBy: true,
				assignedTo: true,
				closedBy: true,
				closedAt: true,
				resolutionSummary: true,
				createdAt: true,
				updatedAt: true,
			})}
			defaultValues={defaultValues}
			onSuccess={({ id }) => router.push(`/student-services/referrals/${id}`)}
		>
			{(form) => (
				<Stack gap='md'>
					<StudentInput value={stdNo} onChange={setStdNo} required />
					{student && <StudentPreviewCard student={student} />}
					<Group grow align='flex-start'>
						<Select
							label='Reason'
							placeholder='Select reason'
							data={reasonOptions}
							required
							{...form.getInputProps('reason')}
						/>
						{form.values.reason === 'other' && (
							<TextInput
								label='Other Reason'
								placeholder='Specify the reason'
								required
								{...form.getInputProps('otherReason')}
							/>
						)}
					</Group>
					<Textarea
						label='Description'
						placeholder='Provide details about the referral...'
						minRows={4}
						autosize
						required
						{...form.getInputProps('description')}
					/>
				</Stack>
			)}
		</Form>
	);
}
