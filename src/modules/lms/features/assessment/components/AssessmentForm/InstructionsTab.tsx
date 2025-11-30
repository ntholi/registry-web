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

type InstructionsTabProps = {
	form: UseFormReturnType<FormValues>;
};

export default function InstructionsTab({ form }: InstructionsTabProps) {
	return (
		<RichTextField
			label='Instructions'
			height={350}
			{...form.getInputProps('instructions')}
		/>
	);
}
