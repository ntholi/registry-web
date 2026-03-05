'use client';

import {
	Card,
	Flex,
	Group,
	Skeleton,
	Stack,
	Text,
	Textarea,
} from '@mantine/core';
import { certificateReprints } from '@registry/_database';
import EditStudentModal from '@registry/students/_components/info/EditStudentModal';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import StdNoInput from '@/app/dashboard/base/StdNoInput';
import { getPublishedAcademicHistory } from '@/app/registry/students/_server/actions';
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
	const [stdNo, setStdNo] = useState<number | null>(
		defaultValues?.stdNo ?? null
	);

	const isValidStdNo = stdNo !== null && String(stdNo).length === 9;

	const { data: student, isLoading } = useQuery({
		queryKey: ['student', stdNo, 'published'],
		queryFn: () => getPublishedAcademicHistory(stdNo!),
		enabled: isValidStdNo,
	});

	const completedProgram = student?.programs?.find(
		(p) => p?.status === 'Completed'
	);

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
						onChange={(value) => {
							form.setFieldValue('stdNo', value as number);
							const strValue = String(value);
							if (strValue.length === 9) setStdNo(Number(value));
							else setStdNo(null);
						}}
					/>

					<Card withBorder>
						{isLoading ? (
							<Stack gap={6}>
								{[1, 2, 3, 4].map((i) => (
									<Skeleton key={i} height={16} width={`${60 + i * 5}%`} />
								))}
							</Stack>
						) : (
							<Stack gap={4}>
								<Flex justify={'space-between'}>
									<InfoRow label='Name' value={student?.name} />
									{student && <EditStudentModal student={student} />}
								</Flex>
								<InfoRow label='Phone 1' value={student?.phone1} />
								<InfoRow label='Phone 2' value={student?.phone2} />
								<InfoRow
									label='Graduation Date'
									value={completedProgram?.graduationDate}
								/>
							</Stack>
						)}
					</Card>
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

type InfoRowProps = {
	label: string;
	value: string | null | undefined;
};

function InfoRow({ label, value }: InfoRowProps) {
	return (
		<Group gap='xs'>
			<Text size='sm' c='dimmed' w={120}>
				{label}:
			</Text>
			<Text size='sm' fw={500}>
				{value || 'N/A'}
			</Text>
		</Group>
	);
}
