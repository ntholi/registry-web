'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import { Alert, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconBan } from '@tabler/icons-react';
import { useRouter } from 'nextjs-toploader/app';
import { type ReactNode, useState } from 'react';
import {
	DocumentUpload,
	type DocumentUploadResult,
} from '@/app/apply/_components/DocumentUpload';
import type { DocumentUploadType } from '@/app/apply/_lib/types';
import {
	type ActionResult,
	getActionErrorMessage,
} from '@/shared/lib/actions/actionResult';
import { DocumentCardSkeleton } from '@/shared/ui/DocumentCardShell';
import WizardNavigation from './WizardNavigation';

type Props<T, DT extends DocumentUploadType = DocumentUploadType> = {
	applicationId: string;
	title: string;
	description: ReactNode;
	documentType: DT;
	documents: T[];
	onUpload: (
		result: DocumentUploadResult<DT>
	) => Promise<ActionResult<unknown>>;
	onDelete: (doc: T) => Promise<ActionResult<unknown>>;
	renderCard: (doc: T, onDelete: () => Promise<void>) => ReactNode;
	nextDisabled: boolean;
	nextPath: string;
	backPath?: string;
	hideBack?: boolean;
	uploadTitle: string;
	uploadDescription: string;
	successMessage: string;
	uploadedLabel?: string;
	applicantName?: string;
	extraDisabled?: boolean;
};

export default function DocumentStepForm<T, DT extends DocumentUploadType>({
	applicationId,
	title,
	description,
	documentType,
	documents,
	onUpload,
	onDelete,
	renderCard,
	nextDisabled,
	nextPath,
	backPath,
	hideBack,
	uploadTitle,
	uploadDescription,
	successMessage,
	uploadedLabel = 'Uploaded Documents',
	applicantName,
	extraDisabled,
}: Props<T, DT>) {
	const router = useRouter();
	const [uploading, setUploading] = useState(false);
	const [uploadKey, setUploadKey] = useState(0);
	const [pendingUploads, setPendingUploads] = useState(0);

	const { refetch, documentLimits, isLoading, applicant } = useApplicant();
	const applicantId = applicant?.id ?? '';

	async function handleUploadComplete(result: DocumentUploadResult<DT>) {
		if (!applicantId) {
			notifications.show({
				title: 'Upload failed',
				message: 'Applicant data not loaded yet. Please try again.',
				color: 'red',
			});
			return;
		}
		setUploading(true);
		setPendingUploads((prev) => prev + 1);
		const res = await onUpload(result);
		if (!res.success) {
			notifications.show({
				title: 'Upload failed',
				message: getActionErrorMessage(res.error),
				color: 'red',
			});
		} else {
			await refetch();
			setUploadKey((prev) => prev + 1);
			notifications.show({
				title: 'Document uploaded',
				message: successMessage,
				color: 'green',
			});
		}
		setUploading(false);
		setPendingUploads((prev) => Math.max(0, prev - 1));
	}

	async function handleDelete(doc: T) {
		const res = await onDelete(doc);
		if (!res.success) {
			notifications.show({
				title: 'Delete failed',
				message: getActionErrorMessage(res.error),
				color: 'red',
			});
			return;
		}
		await refetch();
	}

	const showUploaded = documents.length > 0 || pendingUploads > 0;
	const uploadDisabled = Boolean(
		isLoading ||
			!applicantId ||
			uploading ||
			documentLimits.isAtLimit ||
			extraDisabled ||
			pendingUploads > 0
	);

	return (
		<Paper withBorder radius='md' p='lg'>
			<Stack gap='lg'>
				<Stack gap='xs'>
					<Title order={3}>{title}</Title>
					<Text c='dimmed' size='sm'>
						{description}
					</Text>
				</Stack>

				{documentLimits.isAtLimit && (
					<Alert
						color='red'
						icon={<IconBan size={16} />}
						title='Document limit reached'
					>
						You have uploaded the maximum of {documentLimits.max} documents.
						Remove some documents to upload more.
					</Alert>
				)}

				{documentLimits.isNearLimit && !documentLimits.isAtLimit && (
					<Alert
						color='yellow'
						icon={<IconAlertTriangle size={16} />}
						title='Approaching document limit'
					>
						You have uploaded {documentLimits.current} documents and are nearing
						your maximum limit. Be careful to only upload what is necessary.
					</Alert>
				)}

				<DocumentUpload
					key={uploadKey}
					type={documentType}
					onUploadComplete={handleUploadComplete}
					disabled={uploadDisabled}
					title={uploadTitle}
					description={uploadDescription}
					applicantName={applicantName}
				/>

				{showUploaded && (
					<Stack gap='sm'>
						<Text fw={500} size='sm'>
							{uploadedLabel}
						</Text>
						<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
							{documents.map((doc, _i) =>
								renderCard(doc, () => handleDelete(doc))
							)}
							{Array.from({ length: pendingUploads }).map((_, i) => (
								<DocumentCardSkeleton key={`skeleton-${i}`} />
							))}
						</SimpleGrid>
					</Stack>
				)}

				<WizardNavigation
					applicationId={applicationId}
					backPath={backPath}
					onNext={() => router.push(nextPath)}
					nextDisabled={nextDisabled}
					hideBack={hideBack}
				/>
			</Stack>
		</Paper>
	);
}
