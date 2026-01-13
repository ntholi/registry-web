'use client';

import {
	Button,
	Checkbox,
	Divider,
	Flex,
	Select,
	Stack,
	Textarea,
	TextInput,
	Title,
} from '@mantine/core';
import type { FileWithPath } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import {
	RESOURCE_TYPE_OPTIONS,
	type ResourceType,
	type ResourceWithRelations,
} from '../_lib/types';
import { createResource, updateResource } from '../_server/actions';
import UploadField from './UploadField';

type Props = {
	defaultValues?: ResourceWithRelations;
	title?: string;
};

export default function ResourceForm({ defaultValues, title }: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const isEditing = !!defaultValues;

	const [formTitle, setFormTitle] = useState(defaultValues?.title || '');
	const [description, setDescription] = useState(
		defaultValues?.description || ''
	);
	const [type, setType] = useState<ResourceType | ''>(
		defaultValues?.type || ''
	);
	const [isDownloadable, setIsDownloadable] = useState(
		defaultValues?.isDownloadable ?? true
	);
	const [file, setFile] = useState<FileWithPath | null>(null);

	const mutation = useMutation({
		mutationFn: async () => {
			const formData = new FormData();
			formData.append('title', formTitle);
			formData.append('description', description || '');
			formData.append('type', type);
			formData.append('isDownloadable', String(isDownloadable));
			if (file) {
				formData.append('file', file);
			}

			if (isEditing) {
				return updateResource(defaultValues.id, formData);
			}
			return createResource(formData);
		},
		onSuccess: async (data) => {
			await queryClient.invalidateQueries({
				queryKey: ['resources'],
				refetchType: 'all',
			});
			notifications.show({
				title: 'Success',
				message: isEditing
					? 'Resource updated successfully'
					: 'Resource uploaded successfully',
				color: 'green',
			});
			router.push(`/library/resources/${data.id}`);
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	const isValid = formTitle && type && (isEditing || file);

	return (
		<Stack>
			<Flex justify='space-between' align='center'>
				<Title order={3} fw={100}>
					{title}
				</Title>
				<Button
					onClick={() => mutation.mutate()}
					loading={mutation.isPending}
					disabled={!isValid}
					leftSection={<IconDeviceFloppy size='1rem' />}
				>
					Save
				</Button>
			</Flex>
			<Divider />

			<TextInput
				label='Title'
				required
				value={formTitle}
				onChange={(e) => setFormTitle(e.currentTarget.value)}
			/>

			<Textarea
				label='Description'
				value={description}
				onChange={(e) => setDescription(e.currentTarget.value)}
				rows={3}
			/>

			<Select
				label='Type'
				required
				data={
					RESOURCE_TYPE_OPTIONS as unknown as { value: string; label: string }[]
				}
				value={type}
				onChange={(value) => setType(value as ResourceType)}
			/>

			<Checkbox
				label='Allow downloads'
				checked={isDownloadable}
				onChange={(e) => setIsDownloadable(e.currentTarget.checked)}
			/>

			<UploadField
				value={file}
				onChange={setFile}
				currentFileName={defaultValues?.originalName}
			/>
		</Stack>
	);
}
