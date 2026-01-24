'use client';

import { Box, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCertificate } from '@tabler/icons-react';
import {
	DocumentCardShell,
	DocumentDetailRow,
} from '@/shared/ui/DocumentCardShell';
import { QualificationDetailsModal } from './QualificationDetailsModal';

export type SubjectGrade = {
	id: string;
	originalGrade: string;
	standardGrade: string;
	subject: { id: string; name: string };
};

export type AcademicRecord = {
	id: string;
	certificateType?: { name: string; lqfLevel?: number | null } | null;
	institutionName?: string | null;
	examYear?: number | null;
	resultClassification?: string | null;
	qualificationName?: string | null;
	certificateNumber?: string | null;
	subjectGrades?: SubjectGrade[];
};

type Props = {
	record: AcademicRecord;
	onDelete: () => Promise<void>;
	deleting?: boolean;
};

export function AcademicRecordCard({ record, onDelete, deleting }: Props) {
	const [detailsOpened, { open: openDetails, close: closeDetails }] =
		useDisclosure(false);

	const hasSubjects = record.subjectGrades && record.subjectGrades.length > 0;

	return (
		<>
			<QualificationDetailsModal
				record={record}
				opened={detailsOpened}
				onClose={closeDetails}
			/>

			<DocumentCardShell
				icon={<IconCertificate size={20} />}
				title={record.certificateType?.name ?? 'Certificate'}
				onDelete={onDelete}
				deleting={deleting}
				deleteMessage='Are you sure you want to delete this academic record? This action cannot be undone.'
				onClick={openDetails}
			>
				<Stack gap={4}>
					<DocumentDetailRow
						label='Institution'
						value={record.institutionName}
					/>
					<DocumentDetailRow label='Year' value={record.examYear} />
					{hasSubjects && (
						<Stack gap='xs'>
							<Box w={80} />
							<Text size='xs' c='dimmed' fs='italic' mt={4}>
								{record.subjectGrades?.length}{' '}
								{record.subjectGrades?.length === 1 ? 'subject' : 'subjects'}{' '}
								Found, tap to view
							</Text>
						</Stack>
					)}
				</Stack>
			</DocumentCardShell>
		</>
	);
}
