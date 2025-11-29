'use client';

import {
	Button,
	Group,
	Modal,
	Radio,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { Dropzone, type FileWithPath } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconFile, IconPlus, IconUpload, IconX } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import RichTextField from '@/shared/ui/adease/RichTextField';
import { createFile, createPage } from '../server/actions';
import type { MaterialType } from '../types';

const pageSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	content: z.string().min(1, 'Page content is required'),
});

const fileSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	file: z
		.instanceof(File, { message: 'File is required' })
		.refine((file) => file.size > 0, 'File cannot be empty')
		.refine(
			(file) => file.size <= 100 * 1024 * 1024,
			'File size must be less than 100MB'
		),
});

type PageFormValues = z.infer<typeof pageSchema>;
type FileFormValues = z.infer<typeof fileSchema>;

type MaterialFormProps = {
	courseId: number;
};

export default function MaterialForm({ courseId }: MaterialFormProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const [materialType, setMaterialType] = useState<MaterialType>('page');
	const queryClient = useQueryClient();

	const pageForm = useForm<PageFormValues>({
		validate: zodResolver(pageSchema),
		initialValues: {
			name: '',
			content: '',
		},
	});

	const fileForm = useForm<FileFormValues>({
		validate: zodResolver(fileSchema),
		initialValues: {
			name: '',
			file: null as unknown as File,
		},
	});

	const fileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => {
				const result = reader.result as string;
				const base64 = result.split(',')[1];
				resolve(base64);
			};
			reader.onerror = (error) => reject(error);
		});
	};

	const pageMutation = useMutation({
		mutationFn: async (values: PageFormValues) => {
			return createPage({
				courseid: courseId,
				name: values.name,
				content: values.content,
			});
		},
		onSuccess: () => {
			notifications.show({
				message: 'Page created successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['material-pages', courseId],
			});
			pageForm.reset();
			handleClose();
		},
		onError: (error) => {
			notifications.show({
				message: error.message || 'Failed to create page',
				color: 'red',
			});
		},
	});

	const fileMutation = useMutation({
		mutationFn: async (values: FileFormValues) => {
			const base64Content = await fileToBase64(values.file);
			return createFile({
				courseid: courseId,
				name: values.name,
				filename: values.file.name,
				filecontent: base64Content,
			});
		},
		onSuccess: () => {
			notifications.show({
				message: 'File uploaded successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['material-pages', courseId],
			});
			fileForm.reset();
			handleClose();
		},
		onError: (error) => {
			notifications.show({
				message: error.message || 'Failed to upload file',
				color: 'red',
			});
		},
	});

	const handleClose = () => {
		close();
		setMaterialType('page');
		pageForm.reset();
		fileForm.reset();
	};

	const handlePageSubmit = pageForm.onSubmit((values) => {
		pageMutation.mutate(values);
	});

	const handleFileSubmit = fileForm.onSubmit((values) => {
		fileMutation.mutate(values);
	});

	const handleFileDrop = (files: FileWithPath[]) => {
		if (files.length > 0) {
			fileForm.setFieldValue('file', files[0]);
		}
	};

	return (
		<>
			<Button
				onClick={open}
				variant='light'
				leftSection={<IconPlus size={16} />}
				size='xs'
			>
				New
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Create Material'
				size='lg'
			>
				<Stack>
					<Radio.Group
						value={materialType}
						onChange={(value) => setMaterialType(value as MaterialType)}
						label='Material Type'
						description='Choose the type of material you want to create'
					>
						<Group mt='xs'>
							<Radio value='page' label='Page' />
							<Radio value='file' label='File' />
						</Group>
					</Radio.Group>

					{materialType === 'page' ? (
						<form onSubmit={handlePageSubmit}>
							<Stack>
								<TextInput
									label='Name'
									placeholder='Enter page name'
									required
									{...pageForm.getInputProps('name')}
								/>

								<RichTextField
									label='Page Content'
									height={300}
									{...pageForm.getInputProps('content')}
								/>

								<Button type='submit' loading={pageMutation.isPending}>
									Create Page
								</Button>
							</Stack>
						</form>
					) : (
						<form onSubmit={handleFileSubmit}>
							<Stack>
								<TextInput
									label='Name'
									placeholder='Enter file name/description'
									required
									{...fileForm.getInputProps('name')}
								/>

								<div>
									<Text size='sm' fw={500} mb='xs'>
										File
									</Text>
									<Dropzone
										onDrop={handleFileDrop}
										maxSize={100 * 1024 * 1024}
										maxFiles={1}
										multiple={false}
									>
										<Group
											justify='center'
											gap='xl'
											mih={120}
											style={{ pointerEvents: 'none' }}
										>
											<Dropzone.Accept>
												<IconUpload size={52} stroke={1.5} />
											</Dropzone.Accept>
											<Dropzone.Reject>
												<IconX size={52} stroke={1.5} />
											</Dropzone.Reject>
											<Dropzone.Idle>
												<IconFile size={52} stroke={1.5} />
											</Dropzone.Idle>

											<div>
												<Text size='xl' inline>
													{fileForm.values.file
														? fileForm.values.file.name
														: 'Drag file here or click to select'}
												</Text>
												<Text size='sm' c='dimmed' inline mt={7}>
													File should not exceed 100MB
												</Text>
											</div>
										</Group>
									</Dropzone>
									{fileForm.errors.file && (
										<Text c='red' size='sm' mt={5}>
											{fileForm.errors.file}
										</Text>
									)}
								</div>

								<Button type='submit' loading={fileMutation.isPending}>
									Upload File
								</Button>
							</Stack>
						</form>
					)}
				</Stack>
			</Modal>
		</>
	);
}
