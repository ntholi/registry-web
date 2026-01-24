'use client';

import type { ApplicantWithRelations } from '@admissions/applicants';
import { Card, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import {
	IconCertificate,
	IconFile,
	IconFileText,
	IconId,
	IconPhoto,
} from '@tabler/icons-react';
import { formatDateTime } from '@/shared/lib/utils/dates';

interface Props {
	applicant: ApplicantWithRelations;
}

export function DocumentsTab({ applicant }: Props) {
	const documents = applicant.documents;

	if (documents.length === 0) {
		return (
			<Stack align='center' py='xl'>
				<IconFileText size={48} color='var(--mantine-color-dimmed)' />
				<Text c='dimmed'>No documents uploaded yet</Text>
			</Stack>
		);
	}

	return (
		<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
			{documents.map((doc) => (
				<DocumentCard
					key={doc.id}
					dateUploaded={formatDateTime(doc.document.createdAt)}
					type={doc.document.type ?? 'other'}
					url={doc.document.fileUrl ?? '#'}
				/>
			))}
		</SimpleGrid>
	);
}

interface DocumentCardProps {
	dateUploaded: string;
	type: string;
	url: string;
}

function DocumentCard({ dateUploaded, type, url }: DocumentCardProps) {
	const icon = getDocumentIcon(type);
	const label = getDocumentLabel(type);
	const color = getDocumentColor(type);

	return (
		<Card
			component='a'
			href={url}
			target='_blank'
			rel='noopener noreferrer'
			withBorder
			radius='md'
			p='md'
		>
			<Stack gap='md' align='center' ta='center'>
				<ThemeIcon size={50} radius='md' variant='light' color={color}>
					{icon}
				</ThemeIcon>
				<Stack gap={4}>
					<Text size='sm' fw={600} lineClamp={1}>
						{label}
					</Text>
					<Text size='xs' c='dimmed'>
						Uploaded: {dateUploaded}
					</Text>
				</Stack>
			</Stack>
		</Card>
	);
}

function getDocumentIcon(type: string) {
	switch (type) {
		case 'identity':
			return <IconId size={20} />;
		case 'certificate':
		case 'transcript':
			return <IconCertificate size={20} />;
		case 'photo':
			return <IconPhoto size={20} />;
		default:
			return <IconFile size={20} />;
	}
}

function getDocumentLabel(type: string): string {
	const labels: Record<string, string> = {
		identity: 'Identity',
		certificate: 'Certificate',
		transcript: 'Transcript',
		photo: 'Photo',
		other: 'Other',
	};
	return labels[type] ?? type;
}

function getDocumentColor(type: string): string {
	const colors: Record<string, string> = {
		identity: 'blue',
		certificate: 'green',
		transcript: 'teal',
		photo: 'violet',
		other: 'gray',
	};
	return colors[type] ?? 'gray';
}
