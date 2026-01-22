'use client';

import { Select, Textarea, TextInput } from '@mantine/core';
import type { FileWithPath } from '@mantine/dropzone';
import { useRouter } from 'nextjs-toploader/app';
import { useRef, useState } from 'react';
import { Form } from '@/shared/ui/adease';
import {
	RESOURCE_TYPE_OPTIONS,
	type Resource,
	type ResourceFormData,
	type ResourceType,
	type ResourceWithRelations,
} from '../_lib/types';
import UploadField from './UploadField';

type Props = {
	onSubmit: (values: ResourceFormData) => Promise<Resource>;
	defaultValues?: ResourceWithRelations;
	title?: string;
};

export default function ResourceForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();
	const [file, setFile] = useState<FileWithPath | null>(null);
	const fileRef = useRef<FileWithPath | null>(null);

	fileRef.current = file;

	async function handleSubmit(values: ResourceFormData): Promise<Resource> {
		return onSubmit({
			...values,
			file: fileRef.current || undefined,
		});
	}

	const initialValues: ResourceFormData = {
		title: defaultValues?.title || '',
		description: defaultValues?.description || '',
		type: defaultValues?.type || ('' as ResourceType),
	};

	return (
		<Form<ResourceFormData, ResourceFormData, Resource>
			title={title}
			action={handleSubmit}
			queryKey={['resources']}
			defaultValues={initialValues}
			onSuccess={(data) => router.push(`/library/resources/${data.id}`)}
		>
			{(form) => (
				<>
					<TextInput label='Title' required {...form.getInputProps('title')} />

					<Textarea
						label='Description'
						rows={3}
						{...form.getInputProps('description')}
					/>

					<Select
						label='Type'
						required
						data={
							RESOURCE_TYPE_OPTIONS as unknown as {
								value: string;
								label: string;
							}[]
						}
						{...form.getInputProps('type')}
					/>

					<UploadField
						value={file}
						onChange={setFile}
						currentFileName={defaultValues?.document?.fileName}
					/>
				</>
			)}
		</Form>
	);
}
