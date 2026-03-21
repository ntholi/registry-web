'use client';

import { getStructureSemestersByStructureId } from '@academic/schools/structures/_server/actions';
import RecordAuditHistory from '@audit-logs/_components/RecordAuditHistory';
import { getAllSponsors } from '@finance/sponsors';
import {
	ActionIcon,
	Alert,
	Button,
	Group,
	Loader,
	Modal,
	Select,
	Tabs,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { type SemesterStatus, semesterStatus } from '@registry/_database';
import { IconAlertCircle, IconEdit } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useAllTerms } from '@/shared/lib/hooks/use-term';
import { updateStudentSemester } from '../../_server/actions';
import ReasonsAndAttachments, {
	isReasonsEmpty,
	uploadEditAttachments,
} from '../ReasonsAndAttachments';

interface StudentSemester {
	id: number;
	termCode: string;
	structureSemesterId: number;
	status: SemesterStatus;
	sponsorId: number | null;
	studentProgramId: number;
}

type Props = {
	semester: StudentSemester;
	structureId: number;
	stdNo: number;
	visible?: boolean;
};

const FIELD_LABELS: Record<string, string> = {
	termCode: 'Term',
	status: 'Status',
	structureSemesterId: 'Structure Semester',
	sponsorId: 'Sponsor',
	studentProgramId: 'Student Program',
};

export default function EditStudentSemesterModal({
	semester,
	structureId,
	stdNo,
	visible = true,
}: Props) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showReasonWarning, setShowReasonWarning] = useState(false);
	const [pendingSubmit, setPendingSubmit] = useState(false);
	const [pendingFiles, setPendingFiles] = useState<File[]>([]);

	const { data: termsData = [], isLoading: isLoadingTerms } = useAllTerms({
		enabled: opened,
		select: (data) => data.map((t) => ({ value: t.code, label: t.code })),
	});

	const { data: sponsorsData = [], isLoading: isLoadingSponsors } = useQuery({
		queryKey: ['sponsors'],
		queryFn: getAllSponsors,
		enabled: opened,
		select: (data) =>
			data.map((s) => ({ value: s.id.toString(), label: s.name })),
	});

	const {
		data: structureSemestersData = [],
		isLoading: isLoadingStructureSemesters,
	} = useQuery({
		queryKey: ['structure-semesters', structureId],
		queryFn: async () => await getStructureSemestersByStructureId(structureId),
		enabled: opened,
		select: (data) =>
			data.map((s) => ({ value: s.id.toString(), label: s.name })),
	});

	const form = useForm({
		initialValues: {
			termCode: semester.termCode,
			status: semester.status,
			structureSemesterId: semester.structureSemesterId.toString(),
			sponsorId: semester.sponsorId?.toString() || '',
			reasons: '',
		},
	});

	useEffect(() => {
		if (opened) {
			form.setValues({
				termCode: semester.termCode,
				status: semester.status,
				structureSemesterId: semester.structureSemesterId.toString(),
				sponsorId: semester.sponsorId?.toString() || '',
				reasons: '',
			});
			setShowReasonWarning(false);
			setPendingSubmit(false);
			setPendingFiles([]);
		}
	}, [opened, semester, form.setValues]);

	function addPendingFile(file: File | null) {
		if (file) setPendingFiles((prev) => [...prev, file]);
	}

	function removePendingFile(index: number) {
		setPendingFiles((prev) => prev.filter((_, i) => i !== index));
	}

	const executeSubmit = useCallback(
		async (values: typeof form.values) => {
			setIsSubmitting(true);
			try {
				await updateStudentSemester(
					semester.id,
					{
						termCode: values.termCode,
						status: values.status as SemesterStatus,
						structureSemesterId: parseInt(values.structureSemesterId, 10),
						sponsorId: values.sponsorId ? parseInt(values.sponsorId, 10) : null,
					},
					stdNo,
					values.reasons
				);

				await uploadEditAttachments(stdNo, values.reasons, pendingFiles);

				notifications.show({
					title: 'Success',
					message: 'Student semester updated successfully',
					color: 'green',
				});

				queryClient.invalidateQueries({ queryKey: ['student'] });
				queryClient.invalidateQueries({
					queryKey: ['audit-history', 'student_semesters', String(semester.id)],
				});

				form.reset();
				setPendingFiles([]);
				close();
			} catch (error) {
				notifications.show({
					title: 'Error',
					message: `Failed to update student semester: ${error}`,
					color: 'red',
				});
			} finally {
				setIsSubmitting(false);
				setShowReasonWarning(false);
				setPendingSubmit(false);
			}
		},
		[semester.id, form, close, queryClient, stdNo, pendingFiles]
	);

	const handleSubmit = useCallback(
		async (values: typeof form.values) => {
			if (isReasonsEmpty(values.reasons) && !pendingSubmit) {
				setShowReasonWarning(true);
				setPendingSubmit(true);
				return;
			}
			await executeSubmit(values);
		},
		[executeSubmit, pendingSubmit]
	);

	return (
		<>
			<ActionIcon
				component='div'
				size='sm'
				variant='subtle'
				color='gray'
				onClick={(e) => {
					e.stopPropagation();
					open();
				}}
				style={{
					opacity: visible ? 1 : 0,
					transition: 'opacity 0.2s',
				}}
			>
				<IconEdit size='1rem' />
			</ActionIcon>
			<Modal
				opened={opened}
				onClose={close}
				title='Edit Student Semester'
				size='xl'
			>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Tabs defaultValue='details'>
						<Tabs.List>
							<Tabs.Tab value='details'>Details</Tabs.Tab>
							<Tabs.Tab value='reasons'>Reasons</Tabs.Tab>
							<Tabs.Tab value='history'>History</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value='details' pt='md'>
							<Select
								label='Term'
								placeholder='Select term'
								searchable
								clearable
								data={termsData}
								required
								mb='md'
								disabled={isLoadingTerms}
								{...form.getInputProps('termCode')}
								rightSection={isLoadingTerms ? <Loader size='xs' /> : undefined}
							/>
							<Select
								label='Status'
								placeholder='Select status'
								searchable
								clearable
								data={semesterStatus.enumValues.map((s) => ({
									value: s,
									label: s,
								}))}
								required
								mb='md'
								{...form.getInputProps('status')}
							/>
							<Select
								label='Structure Semester'
								placeholder='Select structure semester'
								searchable
								clearable
								data={structureSemestersData}
								required
								mb='md'
								disabled={isLoadingStructureSemesters}
								{...form.getInputProps('structureSemesterId')}
								rightSection={
									isLoadingStructureSemesters ? <Loader size='xs' /> : undefined
								}
							/>
							<Select
								label='Sponsor'
								placeholder='Select sponsor (optional)'
								searchable
								clearable
								data={sponsorsData}
								mb='md'
								disabled={isLoadingSponsors}
								{...form.getInputProps('sponsorId')}
								rightSection={
									isLoadingSponsors ? <Loader size='xs' /> : undefined
								}
							/>
						</Tabs.Panel>

						<Tabs.Panel value='reasons' pt='md'>
							<ReasonsAndAttachments
								value={form.values.reasons}
								onChange={(value) => form.setFieldValue('reasons', value)}
								pendingFiles={pendingFiles}
								onAddFile={addPendingFile}
								onRemoveFile={removePendingFile}
							/>
						</Tabs.Panel>

						<Tabs.Panel value='history' pt='md'>
							<RecordAuditHistory
								tableName='student_semesters'
								recordId={semester.id}
								fieldLabels={FIELD_LABELS}
							/>
						</Tabs.Panel>
					</Tabs>

					{showReasonWarning && (
						<Alert
							icon={<IconAlertCircle size={16} />}
							color='yellow'
							mt='md'
							variant='light'
						>
							You have not provided a reason for this update. Provide the reason
							then click Update to proceed.
						</Alert>
					)}

					<Group justify='flex-end' mt='md'>
						<Button
							variant='outline'
							onClick={close}
							disabled={
								isSubmitting ||
								isLoadingTerms ||
								isLoadingSponsors ||
								isLoadingStructureSemesters
							}
						>
							Cancel
						</Button>
						<Button
							type='submit'
							loading={isSubmitting}
							disabled={
								isLoadingTerms ||
								isLoadingSponsors ||
								isLoadingStructureSemesters
							}
						>
							Update
						</Button>
					</Group>
				</form>
			</Modal>
		</>
	);
}
