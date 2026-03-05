'use client';

import { Textarea } from '@mantine/core';
import { certificateReprints } from '@registry/_database';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import StdNoInput from '@/app/dashboard/base/StdNoInput';
import { Form, ReceiptInput } from '@/shared/ui/adease';

type CertificateReprint = typeof certificateReprints.$inferInsert;

type Props = {
	onSubmit: (values: CertificateReprint) => Promise<{ id: number }>;
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
		>
			{(form) => (
				<>
					<StdNoInput
						{...form.getInputProps('stdNo')}
						disabled={!!defaultValues?.stdNo}
					/>
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
