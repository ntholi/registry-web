'use client';

import {
	Button,
	Group,
	Modal,
	Paper,
	rem,
	Select,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	Dropzone,
	type FileRejection,
	type FileWithPath,
	IMAGE_MIME_TYPE,
	MIME_TYPES,
} from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { documentTypeEnum } from '@registry/_database';
import {
	IconFile,
	IconFileTypePdf,
	IconFileUpload,
	IconPhoto,
	IconTrash,
	IconUpload,
	IconX,
} from '@tabler/icons-react';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { uploadDocument } from '@/core/integrations/storage';
import { getDocumentFolder, saveApplicantDocument } from '../_server/actions';

type DocumentType = (typeof documentTypeEnum.enumValues)[number];

const TYPE_OPTIONS = documentTypeEnum.enumValues.map((t) => ({
	value: t,
	label: t.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
}));

const ACCEPTED_MIME_TYPES = [...IMAGE_MIME_TYPE, MIME_TYPES.pdf];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const exp = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		units.length - 1
	);
	const val = bytes / 1024 ** exp;
	return `${val.toFixed(val < 10 && exp > 0 ? 1 : 0)} ${units[exp]}`;
}

type UploadModalProps = {
	opened: boolean;
	onClose: () => void;
	applicantId: string;
};

export function UploadModal({
	opened,
	onClose,
	applicantId,
}: UploadModalProps) {
	const router = useRouter();
	const [files, setFiles] = useState<FileWithPath[]>([]);
	const [type, setType] = useState<DocumentType | null>(null);
	const [loading, setLoading] = useState(false);

	function handleDrop(dropped: FileWithPath[]) {
		if (dropped.length > 0) {
			setFiles([dropped[0]]);
		}
	}

	function handleReject(_rejections: FileRejection[]) {
		notifications.show({
			title: 'File not accepted',
			message: 'Please upload a supported file under 10 MB.',
			color: 'red',
		});
	}

	function handleRemoveFile() {
		setFiles([]);
	}

	function handleTypeChange(value: string | null) {
		setType(value as DocumentType | null);
	}

	async function handleSubmit() {
		if (!type) {
			notifications.show({
				title: 'Error',
				message: 'Please select a document type',
				color: 'red',
			});
			return;
		}

		if (files.length === 0) {
			notifications.show({
				title: 'Error',
				message: 'Please select a file to upload',
				color: 'red',
			});
			return;
		}

		try {
			setLoading(true);
			const file = files[0];
			const folder = await getDocumentFolder(applicantId);
			const fileName = `${Date.now()}-${file.name}`;

			await uploadDocument(file, fileName, folder);

			await saveApplicantDocument({
				applicantId,
				fileName,
				type,
			});

			notifications.show({
				title: 'Success',
				message: 'Document uploaded successfully',
				color: 'green',
			});

			router.refresh();

			setFiles([]);
			setType(null);
			onClose();
		} catch (error) {
			console.error('Upload error:', error);
			notifications.show({
				title: 'Error',
				message: 'Failed to upload document',
				color: 'red',
			});
		} finally {
			setLoading(false);
		}
	}

	function handleClose() {
		if (!loading) {
			setFiles([]);
			setType(null);
			onClose();
		}
	}

	function getIcon() {
		const file = files[0];
		if (!file) return <IconFileUpload size={40} stroke={1.5} />;
		if (file.type === 'application/pdf')
			return <IconFileTypePdf size={40} stroke={1.5} />;
		if (file.type.startsWith('image/'))
			return <IconPhoto size={40} stroke={1.5} />;
		return <IconFile size={40} stroke={1.5} />;
	}

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title='Upload Document'
			closeOnClickOutside={!loading}
			closeOnEscape={!loading}
		>
			<Stack gap='lg'>
				<Select
					label='Document Type'
					placeholder='Select type'
					data={TYPE_OPTIONS}
					value={type}
					onChange={handleTypeChange}
					disabled={loading}
					required
				/>

				{files.length === 0 ? (
					<Paper withBorder radius='md' p='lg'>
						<Dropzone
							onDrop={handleDrop}
							onReject={handleReject}
							maxFiles={1}
							maxSize={MAX_FILE_SIZE}
							accept={ACCEPTED_MIME_TYPES}
							style={{ cursor: 'pointer' }}
							disabled={loading}
							loading={loading}
						>
							<Group
								justify='center'
								gap='xl'
								mih={180}
								style={{ pointerEvents: 'none' }}
							>
								<Dropzone.Accept>
									<IconUpload stroke={1.5} size={20} />
								</Dropzone.Accept>
								<Dropzone.Reject>
									<IconX
										style={{
											width: rem(52),
											height: rem(52),
											color: 'var(--mantine-color-red-6)',
										}}
										stroke={1.5}
									/>
								</Dropzone.Reject>
								<Dropzone.Idle>
									<IconFileUpload size='5rem' />
								</Dropzone.Idle>

								<Stack gap={4} align='center'>
									<Text size='lg' inline>
										Drop file here or click to browse
									</Text>
									<Text size='xs' c='dimmed' mt={4}>
										PDF or images • Max 10 MB
									</Text>
								</Stack>
							</Group>
						</Dropzone>
					</Paper>
				) : (
					<Paper withBorder radius='md' p='xl'>
						<Stack
							gap='md'
							align='center'
							style={{ minHeight: rem(180) }}
							justify='center'
						>
							<ThemeIcon variant='default' size={80} radius='md'>
								{getIcon()}
							</ThemeIcon>

							<Stack gap={4} align='center'>
								<Text size='sm' fw={600} ta='center' maw={300} truncate='end'>
									{files[0].name}
								</Text>
								<Text size='sm' c='dimmed'>
									{formatFileSize(files[0].size)}
								</Text>
							</Stack>

							<Button
								variant='light'
								color='red'
								size='sm'
								leftSection={<IconTrash size={16} />}
								onClick={handleRemoveFile}
								disabled={loading}
								mt='xs'
							>
								Remove File
							</Button>
						</Stack>
					</Paper>
				)}

				<Group justify='flex-end' mt='md'>
					<Button variant='subtle' onClick={handleClose} disabled={loading}>
						Cancel
					</Button>
					<Button
						leftSection={<IconUpload size={16} />}
						onClick={handleSubmit}
						loading={loading}
						disabled={!type || files.length === 0}
					>
						Upload
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
