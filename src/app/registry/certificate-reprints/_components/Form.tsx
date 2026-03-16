'use client';

import { Alert, Textarea } from '@mantine/core';
import { certificateReprints } from '@registry/_database';
import { IconAlertCircle } from '@tabler/icons-react';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { useCallback, useState } from 'react';
import type { ActionResult } from '@/shared/lib/actions/actionResult';
import { Form, ReceiptInput } from '@/shared/ui/adease';
import StudentInput from '@/shared/ui/StudentInput';
import StudentInfoCard from './StudentInfoCard';

type CertificateReprint = typeof certificateReprints.$inferInsert;

type Props = {
	onSubmit: (
		values: CertificateReprint
	) => Promise<{ id: string } | ActionResult<{ id: string }>>;
	defaultValues?: CertificateReprint;
	title?: string;
};

const schema = createInsertSchema(certificateReprints).omit({
	status: true,
	createdBy: true,
	createdAt: true,
	updatedAt: true,
	receivedAt: true,
});

export default function CertificateReprintForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();
	const [stdNo, setStdNo] = useState<number | null>(
		defaultValues?.stdNo ?? null
	);
	const [hasGraduationDate, setHasGraduationDate] = useState(true);

	const onGraduationDateChange = useCallback((value: boolean) => {
		setHasGraduationDate(value);
	}, []);

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['certificate-reprints']}
			schema={schema}
			defaultValues={defaultValues}
			onSuccess={({ id }) => {
				router.push(`/registry/certificate-reprints/${id}`);
			}}
			beforeSubmit={(form) => {
				if (!hasGraduationDate) {
					form.setFieldError(
						'stdNo',
						'Student does not have a graduation date'
					);
				}
			}}
		>
			{(form) => (
				<>
					<StudentInput
						{...form.getInputProps('stdNo')}
						disabled={!!defaultValues?.stdNo}
						onChange={(value) => {
							form.setFieldValue('stdNo', value as number);
							const strValue = String(value);
							if (strValue.length === 9) setStdNo(Number(value));
							else setStdNo(null);
						}}
					/>

					<StudentInfoCard
						stdNo={stdNo}
						onGraduationDateChange={onGraduationDateChange}
					/>
					{!hasGraduationDate && (
						<Alert
							color='red'
							icon={<IconAlertCircle size={16} />}
							title='Cannot Create Reprint'
						>
							This student does not have a graduation date. Certificate reprints
							can only be created for graduated students.
						</Alert>
					)}
					<ReceiptInput
						label='Receipt Number'
						{...form.getInputProps('receiptNumber')}
					/>
					<Textarea
						label='Reason for Reprint'
						placeholder='Enter reason why the certificate needs to be reprinted'
						required
						minRows={3}
						{...form.getInputProps('reason')}
					/>
				</>
			)}
		</Form>
	);
}
