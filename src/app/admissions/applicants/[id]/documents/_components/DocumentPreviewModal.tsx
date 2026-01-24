'use client';

import {
	ActionIcon,
	Badge,
	Box,
	Group,
	Image,
	Modal,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
	IconCalendar,
	IconCertificate,
	IconCertificateOff,
	IconDownload,
	IconFile,
} from '@tabler/icons-react';
import { useRouter } from 'nextjs-toploader/app';
import { formatDate } from '@/shared/lib/utils/dates';
import { DeleteButton } from '@/shared/ui/adease/DeleteButton';
import type { ApplicantDocument } from '../_lib/types';
import { deleteApplicantDocument } from '../_server/actions';
import { ReviewModal } from './ReviewModal';

type Props = {
	opened: boolean;
	onClose: () => void;
	applicantDoc: ApplicantDocument | null;
};

function formatType(type: string | null | undefined): string {
	if (!type) return 'Unknown';
	return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function DocumentPreviewModal({ opened, onClose, applicantDoc }: Props) {
	const router = useRouter();

	if (!applicantDoc) return null;

	const { id: docId, verificationStatus, rejectionReason } = applicantDoc;
	const doc = applicantDoc.document;
	const previewUrl = doc.fileUrl ?? '';
	const isPdf = previewUrl.toLowerCase().endsWith('.pdf');
	const isCertified = !!(doc.certifiedBy || doc.certifiedDate);

	async function handleDelete() {
		await deleteApplicantDocument(docId, previewUrl);
	}

	function handleDeleteSuccess() {
		notifications.show({
			title: 'Success',
			message: 'Document deleted',
			color: 'green',
		});
		onClose();
		router.refresh();
	}

	function handleDownload() {
		window.open(previewUrl, '_blank');
	}

	function handleReviewSuccess() {
		onClose();
		router.refresh();
	}

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title='Document Preview'
			size='xl'
			centered
		>
			<Stack gap='md'>
				<Paper
					withBorder
					p='sm'
					pos='sticky'
					top={0}
					style={{ zIndex: 10, background: 'var(--mantine-color-body)' }}
				>
					<Group justify='space-between' wrap='wrap'>
						<Group gap='md'>
							{doc.type && (
								<Group gap='xs'>
									<ThemeIcon variant='light' size='sm' color='gray'>
										<IconFile size={14} />
									</ThemeIcon>
									<Text size='sm' fw={500}>
										{formatType(doc.type)}
									</Text>
								</Group>
							)}
							{doc.createdAt && (
								<Group gap='xs'>
									<ThemeIcon variant='light' size='sm' color='gray'>
										<IconCalendar size={14} />
									</ThemeIcon>
									<Text size='sm' c='dimmed'>
										{formatDate(doc.createdAt)}
									</Text>
								</Group>
							)}
							{isCertified ? (
								<Badge
									leftSection={<IconCertificate size={12} />}
									color='green'
									variant='light'
									radius='xs'
								>
									Certified
								</Badge>
							) : (
								<Badge
									leftSection={<IconCertificateOff size={12} />}
									color='red'
									variant='light'
									radius='xs'
								>
									Not Certified
								</Badge>
							)}
						</Group>

						<Group gap='xs'>
							<Tooltip label='Download'>
								<ActionIcon variant='default' onClick={handleDownload}>
									<IconDownload size={16} />
								</ActionIcon>
							</Tooltip>
							<ReviewModal
								docId={docId}
								initialStatus={verificationStatus}
								initialReason={rejectionReason}
								onSuccess={handleReviewSuccess}
							/>
							<Tooltip label='Delete'>
								<DeleteButton
									handleDelete={handleDelete}
									onSuccess={handleDeleteSuccess}
									itemType='document'
									itemName={doc.fileName ?? undefined}
									typedConfirmation={false}
									variant='light'
								/>
							</Tooltip>
						</Group>
					</Group>
				</Paper>

				<Box h={550}>
					{isPdf ? (
						<iframe
							src={previewUrl}
							style={{ width: '100%', height: '100%', border: 'none' }}
							title='Document Preview'
						/>
					) : (
						<Image
							src={previewUrl}
							alt='Document Preview'
							fit='contain'
							mah='100%'
						/>
					)}
				</Box>
			</Stack>
		</Modal>
	);
}
