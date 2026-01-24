'use client';

import type { ApplicantWithRelations } from '@admissions/applicants';
import {
	Badge,
	Card,
	Group,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconCertificate,
	IconFile,
	IconFileText,
	IconId,
	IconPhoto,
} from '@tabler/icons-react';

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
					name={doc.document.fileName}
					type={doc.document.type ?? 'other'}
					url={doc.document.fileUrl ?? '#'}
				/>
			))}
		</SimpleGrid>
	);
}

interface DocumentCardProps {
	name: string;
	type: string;
	url: string;
}

function DocumentCard({ name, type, url }: DocumentCardProps) {
	const icon = getDocumentIcon(type);
	const label = getDocumentLabel(type);

	return (
		<Card
			component='a'
			href={url}
			target='_blank'
			rel='noopener noreferrer'
			withBorder
			radius='md'
			p='md'
			style={{ cursor: 'pointer' }}
		>
			<Stack gap='sm'>
				<Group>
					<ThemeIcon size='lg' variant='light' color={getDocumentColor(type)}>
						{icon}
					</ThemeIcon>
					<Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
						<Text size='sm' fw={500} truncate>
							{name}
						</Text>
						<Badge size='xs' variant='light' color={getDocumentColor(type)}>
							{label}
						</Badge>
					</Stack>
				</Group>
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
