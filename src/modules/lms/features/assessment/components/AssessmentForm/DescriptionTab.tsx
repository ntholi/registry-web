'use client';

import type { UseFormReturnType } from '@mantine/form';
import RichTextField from '@/shared/ui/adease/RichTextField';

type FormValues = {
	assessmentNumber: string;
	assessmentType: string;
	totalMarks: number;
	weight: number;
	availableFrom: string | null;
	dueDate: string | null;
	description?: string;
	instructions?: string;
	attachments?: File[];
};

type DescriptionTabProps = {
	form: UseFormReturnType<FormValues>;
};

export default function DescriptionTab({ form }: DescriptionTabProps) {
	return (
		<RichTextField
			label='Description'
			height={350}
			{...form.getInputProps('description')}
		/>
	);
}
