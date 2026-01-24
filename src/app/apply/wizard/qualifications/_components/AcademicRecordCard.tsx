'use client';

import {
	ActionIcon,
	Box,
	Button,
	Card,
	Group,
	Modal,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCertificate, IconTrash } from '@tabler/icons-react';
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
	onDelete: () => void;
	deleting: boolean;
};

export function AcademicRecordCard({ record, onDelete, deleting }: Props) {
	const [deleteOpened, { open: openDelete, close: closeDelete }] =
		useDisclosure(false);
	const [detailsOpened, { open: openDetails, close: closeDetails }] =
		useDisclosure(false);

	function handleConfirmDelete() {
		onDelete();
		closeDelete();
	}

	const hasSubjects = record.subjectGrades && record.subjectGrades.length > 0;

	return (
		<>
			<DeleteAcademicModal
				opened={deleteOpened}
				onClose={closeDelete}
				onConfirm={handleConfirmDelete}
				deleting={deleting}
			/>

			<QualificationDetailsModal
				record={record}
				opened={detailsOpened}
				onClose={closeDetails}
			/>

			<Card
				withBorder
				radius='md'
				p='md'
				style={{ cursor: 'pointer' }}
				onClick={openDetails}
			>
				<Stack gap='sm'>
					<Group wrap='nowrap' justify='space-between'>
						<Group wrap='nowrap'>
							<ThemeIcon size='lg' variant='light' color='green'>
								<IconCertificate size={20} />
							</ThemeIcon>
							<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
								<Group gap='xs'>
									<Text size='sm' fw={600} truncate>
										{record.certificateType?.name ?? 'Certificate'}
									</Text>
								</Group>
							</Stack>
						</Group>
						<ActionIcon
							variant='subtle'
							color='red'
							onClick={(e) => {
								e.stopPropagation();
								openDelete();
							}}
							disabled={deleting}
						>
							<IconTrash size={16} />
						</ActionIcon>
					</Group>
					<Stack gap={4}>
						{record.institutionName && (
							<Group gap='xs'>
								<Text size='xs' c='dimmed' w={80}>
									Institution:
								</Text>
								<Text size='xs' fw={500} style={{ flex: 1 }} truncate>
									{record.institutionName}
								</Text>
							</Group>
						)}
						{record.examYear && (
							<Group gap='xs'>
								<Text size='xs' c='dimmed' w={80}>
									Year:
								</Text>
								<Text size='xs' fw={500}>
									{record.examYear}
								</Text>
							</Group>
						)}
						{hasSubjects && (
							<Group gap='xs'>
								<Box w={80} />
								<Text size='xs' c='dimmed' fs='italic' mt={4}>
									{record.subjectGrades?.length}{' '}
									{record.subjectGrades?.length === 1 ? 'subject' : 'subjects'}{' '}
									Found, tap to view
								</Text>
							</Group>
						)}
					</Stack>
				</Stack>
			</Card>
		</>
	);
}

type DeleteModalProps = {
	opened: boolean;
	onClose: () => void;
	onConfirm: () => void;
	deleting: boolean;
};

function DeleteAcademicModal({
	opened,
	onClose,
	onConfirm,
	deleting,
}: DeleteModalProps) {
	return (
		<Modal opened={opened} onClose={onClose} title='Delete Record' centered>
			<Stack gap='md'>
				<Text size='sm'>
					Are you sure you want to delete this academic record? This action
					cannot be undone.
				</Text>
				<Group justify='flex-end'>
					<Button variant='subtle' onClick={onClose}>
						Cancel
					</Button>
					<Button color='red' onClick={onConfirm} loading={deleting}>
						Delete
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
