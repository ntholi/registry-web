'use client';

import { getAllAuthors } from '@library/authors/_server/actions';
import { MultiSelect, Select, Stack, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import type { FileWithPath } from '@mantine/dropzone';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useRef, useState } from 'react';
import { Form } from '@/shared/ui/adease';
import UploadField from '../../_components/UploadField';
import {
	PUBLICATION_TYPE_OPTIONS,
	type Publication,
	type PublicationFormData,
	type PublicationType,
	type PublicationWithRelations,
} from '../_lib/types';

type Props = {
	onSubmit: (values: PublicationFormData) => Promise<Publication>;
	defaultValues?: PublicationWithRelations;
	title?: string;
};

export default function PublicationForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();
	const [file, setFile] = useState<FileWithPath | null>(null);
	const fileRef = useRef<FileWithPath | null>(null);
	const [authorIds, setAuthorIds] = useState<string[]>(
		defaultValues?.publicationAuthors?.map((pa) => pa.author.id) ?? []
	);
	const [datePublished, setDatePublished] = useState<Date | null>(
		defaultValues?.datePublished ? new Date(defaultValues.datePublished) : null
	);

	const { data: authorsData } = useQuery({
		queryKey: ['authors', 'all'],
		queryFn: getAllAuthors,
	});

	const authorOptions =
		authorsData?.map((a) => ({ value: a.id, label: a.name })) ?? [];

	fileRef.current = file;

	async function handleSubmit(
		values: PublicationFormData
	): Promise<Publication> {
		return onSubmit({
			...values,
			authorIds,
			datePublished: datePublished?.toISOString().split('T')[0] ?? '',
			file: fileRef.current || undefined,
		});
	}

	const initialValues: PublicationFormData = {
		title: defaultValues?.title || '',
		abstract: defaultValues?.abstract || '',
		datePublished: defaultValues?.datePublished || '',
		type: defaultValues?.type || ('' as PublicationType),
		authorIds: [],
	};

	return (
		<Form<PublicationFormData, PublicationFormData, Publication>
			title={title}
			action={handleSubmit}
			queryKey={['publications']}
			defaultValues={initialValues}
			onSuccess={(data) =>
				router.push(`/library/resources/publications/${data.id}`)
			}
		>
			{(form, { isSubmitting }) => (
				<Stack>
					<TextInput label='Title' required {...form.getInputProps('title')} />

					<Textarea
						label='Abstract'
						rows={4}
						{...form.getInputProps('abstract')}
					/>

					<Select
						label='Type'
						required
						data={
							PUBLICATION_TYPE_OPTIONS as unknown as {
								value: string;
								label: string;
							}[]
						}
						{...form.getInputProps('type')}
					/>

					<MultiSelect
						label='Authors'
						data={authorOptions}
						value={authorIds}
						onChange={setAuthorIds}
						searchable
					/>

					<DateInput
						label='Date Published'
						value={datePublished}
						onChange={(value) =>
							setDatePublished(value ? new Date(value) : null)
						}
						valueFormat='YYYY-MM-DD'
						clearable
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
