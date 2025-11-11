'use client';

import { Textarea } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import StdNoInput from '@/app/dashboard/base/StdNoInput';
import { Form } from '@/components/adease';
import { blockedStudents } from '@/db/schema';

type BlockedStudent = typeof blockedStudents.$inferInsert;

type Props = {
	onSubmit: (values: BlockedStudent) => Promise<BlockedStudent>;
	defaultValues?: BlockedStudent;
	onSuccess?: (value: BlockedStudent) => void;
	onError?: (
		error: Error | React.SyntheticEvent<HTMLDivElement, Event>
	) => void;
	title?: string;
};

const blockedStudentSchema = createInsertSchema(blockedStudents).omit({
	byDepartment: true,
	status: true,
});

export default function BlockedStudentForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();
	const [validStudentNo, setValidStudentNo] = useState<boolean>(
		!!defaultValues?.stdNo && String(defaultValues.stdNo).length === 9
	);

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['blocked-students']}
			schema={blockedStudentSchema}
			defaultValues={defaultValues}
			onSuccess={({ id }) => {
				router.push(`/blocked-students/${id}`);
			}}
		>
			{(form) => {
				const handleStdNoChange = (value: number | string) => {
					form.setFieldValue('stdNo', value as number);
					const strValue = String(value);
					setValidStudentNo(
						strValue.length === 9 && strValue.startsWith('9010')
					);
				};

				return (
					<>
						<StdNoInput
							{...form.getInputProps('stdNo')}
							onChange={handleStdNoChange}
						/>

						{validStudentNo && (
							<Textarea label='Reason' {...form.getInputProps('reason')} />
						)}
					</>
				);
			}}
		</Form>
	);
}
