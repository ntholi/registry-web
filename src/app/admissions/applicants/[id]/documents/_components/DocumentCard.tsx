'use client';

import {
	ActionIcon,
	AspectRatio,
	Badge,
	Box,
	Button,
	Card,
	Group,
	Image,
	Modal,
	Stack,
	Text,
	Textarea,
	Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconCheck,
	IconDownload,
	IconEye,
	IconFile,
	IconTrash,
	IconX,
} from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { getDocumentVerificationStatusColor } from '@/shared/lib/utils/colors';
import type { ApplicantDocument } from '../_lib/types';
import {
	deleteApplicantDocument,
	verifyApplicantDocument,
} from '../_server/actions';

function isImageFile(fileName: string | null | undefined): boolean {
	if (!fileName) return false;
	const ext = fileName.toLowerCase().split('.').pop();
	return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
}

function isPdfFile(fileName: string | null | undefined): boolean {
	if (!fileName) return false;
	return fileName.toLowerCase().endsWith('.pdf');
}

type Props = {
	doc: ApplicantDocument;
	onPreview: (url: string) => void;
};

export function DocumentCard({ doc, onPreview }: Props) {
	const router = useRouter();
	const [rejectOpened, { open: openReject, close: closeReject }] =
		useDisclosure(false);
	const [rejectionReason, setRejectionReason] = useState('');

	const fileUrl = doc.document.fileUrl ?? '';
	const isPdf = isPdfFile(doc.document.fileName);
	const isImage = isImageFile(doc.document.fileName);

	const deleteMutation = useMutation({
		mutationFn: async () => {
			await deleteApplicantDocument(doc.id, fileUrl);
		},
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Document deleted',
				color: 'green',
			});
			router.refresh();
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to delete document',
				color: 'red',
			});
		},
	});

	const verifyMutation = useMutation({
		mutationFn: async ({
			status,
			reason,
		}: {
			status: 'verified' | 'rejected';
			reason?: string;
		}) => {
			await verifyApplicantDocument(doc.id, status, reason);
		},
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Document verification updated',
				color: 'green',
			});
			router.refresh();
			closeReject();
			setRejectionReason('');
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to update verification',
				color: 'red',
			});
		},
	});

	function handleDownload() {
		window.open(fileUrl, '_blank');
	}

	function submitRejection() {
		if (rejectionReason) {
			verifyMutation.mutate({ status: 'rejected', reason: rejectionReason });
		}
	}

	return (
		<>
			<Card withBorder padding='xs'>
				<AspectRatio ratio={16 / 9}>
					{isPdf ? (
						<Box
							style={{
								position: 'relative',
								overflow: 'hidden',
								cursor: 'pointer',
							}}
							onClick={() => onPreview(fileUrl)}
						>
							<iframe
								src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
								style={{
									width: '100%',
									height: '100%',
									border: 'none',
									pointerEvents: 'none',
								}}
								title={doc.document.fileName ?? 'PDF'}
							/>
						</Box>
					) : isImage ? (
						<Box
							style={{ cursor: 'pointer' }}
							onClick={() => onPreview(fileUrl)}
						>
							<Image
								src={fileUrl}
								alt={doc.document.fileName ?? 'Document'}
								style={{
									width: '100%',
									height: '100%',
									objectFit: 'cover',
								}}
							/>
						</Box>
					) : (
						<Box
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								backgroundColor: 'var(--mantine-color-dark-6)',
								cursor: 'pointer',
							}}
							onClick={handleDownload}
						>
							<IconFile size={48} color='var(--mantine-color-gray-6)' />
						</Box>
					)}
				</AspectRatio>

				<Stack gap='xs' mt='xs'>
					<Group justify='space-between' wrap='nowrap'>
						<Text size='sm' fw={500} lineClamp={1} style={{ flex: 1 }}>
							{doc.document.fileName}
						</Text>
						<Badge
							size='xs'
							color={getDocumentVerificationStatusColor(doc.verificationStatus)}
						>
							{doc.verificationStatus}
						</Badge>
					</Group>

					{doc.verificationStatus === 'rejected' && doc.rejectionReason && (
						<Text size='xs' c='red' lineClamp={2}>
							{doc.rejectionReason}
						</Text>
					)}

					<Group justify='space-between'>
						<Group gap='xs'>
							{(isPdf || isImage) && (
								<Tooltip label='Preview'>
									<ActionIcon
										variant='light'
										onClick={() => onPreview(fileUrl)}
									>
										<IconEye size={16} />
									</ActionIcon>
								</Tooltip>
							)}
							<Tooltip label='Download'>
								<ActionIcon variant='light' onClick={handleDownload}>
									<IconDownload size={16} />
								</ActionIcon>
							</Tooltip>
							{doc.verificationStatus === 'pending' && (
								<>
									<Tooltip label='Verify'>
										<ActionIcon
											variant='light'
											color='green'
											onClick={() =>
												verifyMutation.mutate({ status: 'verified' })
											}
											loading={verifyMutation.isPending}
										>
											<IconCheck size={16} />
										</ActionIcon>
									</Tooltip>
									<Tooltip label='Reject'>
										<ActionIcon
											variant='light'
											color='red'
											onClick={openReject}
										>
											<IconX size={16} />
										</ActionIcon>
									</Tooltip>
								</>
							)}
						</Group>
						<Tooltip label='Delete'>
							<ActionIcon
								variant='light'
								color='red'
								onClick={() => deleteMutation.mutate()}
								loading={deleteMutation.isPending}
							>
								<IconTrash size={16} />
							</ActionIcon>
						</Tooltip>
					</Group>
				</Stack>
			</Card>

			<Modal
				opened={rejectOpened}
				onClose={closeReject}
				title='Reject Document'
			>
				<Stack gap='sm'>
					<Textarea
						label='Rejection Reason'
						required
						placeholder='Enter reason for rejection'
						value={rejectionReason}
						onChange={(e) => setRejectionReason(e.target.value)}
						rows={3}
					/>
					<Group justify='flex-end'>
						<Button variant='subtle' onClick={closeReject}>
							Cancel
						</Button>
						<Button
							color='red'
							onClick={submitRejection}
							loading={verifyMutation.isPending}
							disabled={!rejectionReason}
						>
							Reject
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
