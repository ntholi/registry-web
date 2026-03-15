'use client';

import { ASSESSMENT_TYPES } from '@academic/assessments/_lib/utils';
import { getModules } from '@academic/modules';
import { Select, Stack } from '@mantine/core';
import type { FileWithPath } from '@mantine/dropzone';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useRef, useState } from 'react';
import { unwrap } from '@/shared/lib/utils/actionResult';
import { Form } from '@/shared/ui/adease';
import TermInput from '@/shared/ui/TermInput';
import UploadField from '../../_components/UploadField';
import type {
	QuestionPaper,
	QuestionPaperFormData,
	QuestionPaperWithRelations,
} from '../_lib/types';

type Props = {
	onSubmit: (values: QuestionPaperFormData) => Promise<QuestionPaper>;
	defaultValues?: QuestionPaperWithRelations;
	title?: string;
};

export default function QuestionPaperForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();
	const [file, setFile] = useState<FileWithPath | null>(null);
	const fileRef = useRef<FileWithPath | null>(null);
	const [moduleSearch, setModuleSearch] = useState('');

	const { data: modulesData } = useQuery({
		queryKey: ['modules', moduleSearch],
		queryFn: () => getModules(1, moduleSearch),
		select: unwrap,
	});

	const moduleOptions =
		modulesData?.items?.map((m) => ({
			value: String(m.id),
			label: `${m.code} - ${m.name}`,
		})) ?? [];

	const assessmentTypeOptions = ASSESSMENT_TYPES.map((t) => ({
		value: t.value,
		label: t.label,
	}));

	fileRef.current = file;

	async function handleSubmit(
		values: QuestionPaperFormData
	): Promise<QuestionPaper> {
		return onSubmit({
			...values,
			file: fileRef.current || undefined,
		});
	}

	const initialValues: QuestionPaperFormData = {
		moduleId: defaultValues?.moduleId || 0,
		termId: defaultValues?.termId || 0,
		assessmentType: defaultValues?.assessmentType || '',
	};

	return (
		<Form<QuestionPaperFormData, QuestionPaperFormData, QuestionPaper>
			title={title}
			action={handleSubmit}
			queryKey={['question-papers']}
			defaultValues={initialValues}
			onSuccess={(data) =>
				router.push(`/library/resources/question-papers/${data.id}`)
			}
		>
			{(form, { isSubmitting }) => (
				<Stack>
					<Select
						label='Module'
						required
						data={moduleOptions}
						searchable
						onSearchChange={setModuleSearch}
						value={form.values.moduleId ? String(form.values.moduleId) : null}
						onChange={(value) =>
							form.setFieldValue('moduleId', value ? Number(value) : 0)
						}
					/>

					<TermInput
						required
						value={form.values.termId}
						onChange={(value) =>
							form.setFieldValue(
								'termId',
								typeof value === 'number' ? value : 0
							)
						}
					/>

					<Select
						label='Assessment Type'
						required
						data={assessmentTypeOptions}
						searchable
						{...form.getInputProps('assessmentType')}
					/>

					<UploadField
						value={file}
						onChange={setFile}
						currentFileName={defaultValues?.document?.fileName}
						loading={isSubmitting}
					/>
				</Stack>
			)}
		</Form>
	);
}
