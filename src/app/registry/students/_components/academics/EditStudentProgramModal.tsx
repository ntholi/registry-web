'use client';

import { getStructuresByProgramId } from '@academic/structures';
import RecordAuditHistory from '@audit-logs/_components/RecordAuditHistory';
import {
	ActionIcon,
	Alert,
	Button,
	Group,
	Loader,
	Modal,
	Select,
	Stack,
	Tabs,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { programStatus, type StudentProgramStatus } from '@registry/_database';
import { IconAlertCircle, IconEdit } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { unwrap } from '@/shared/lib/actions/actionResult';
import { useAllTerms } from '@/shared/lib/hooks/use-term';
import { formatDateToISO, parseDate } from '@/shared/lib/utils/dates';
import { isRichTextEmpty } from '@/shared/lib/utils/files';
import type { AuditAttachmentInfo } from '../../_server/actions';
import {
	updateStudentProgram,
	uploadAuditAttachment,
} from '../../_server/actions';
import ReasonsTab from '../shared/ReasonsTab';

interface StudentProgram {
	id: number;
	stdNo: number;
	intakeDate: string | null;
	regDate: string | null;
	startTerm: string | null;
	structureId: number;
	programId: number;
	graduationDate: string | null;
	status: StudentProgramStatus;
}

type Props = {
	program: StudentProgram;
	visible?: boolean;
};

const FIELD_LABELS: Record<string, string> = {
	status: 'Status',
	structureId: 'Structure',
	intakeDate: 'Intake Date',
	regDate: 'Registration Date',
	startTerm: 'Start Term',
	graduationDate: 'Graduation Date',
	programId: 'Program',
};

export default function EditStudentProgramModal({
	program,
	visible = true,
}: Props) {
	const _queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showReasonWarning, setShowReasonWarning] = useState(false);
	const [pendingSubmit, setPendingSubmit] = useState(false);
	const [pendingFiles, setPendingFiles] = useState<File[]>([]);

	const { data: termsData = [], isLoading: isLoadingTerms } = useAllTerms({
		enabled: opened,
		select: (data) => data.map((t) => ({ value: t.code, label: t.code })),
	});

	const { data: structuresData = [], isLoading: isLoadingStructures } =
		useQuery({
			queryKey: ['structures', program.programId],
			queryFn: async () => await getStructuresByProgramId(program.programId),
			enabled: opened,
			select: (data) =>
				data.map((s) => ({ value: s.id.toString(), label: s.code })),
		});

	const form = useForm({
		initialValues: {
			intakeDate: parseDate(program.intakeDate),
			regDate: parseDate(program.regDate),
			startTerm: program.startTerm || '',
			structureId: program.structureId.toString(),
			graduationDate: parseDate(program.graduationDate),
			status: program.status,
			reasons: '',
		},
	});

	useEffect(() => {
		if (opened) {
			form.setValues({
				intakeDate: parseDate(program.intakeDate),
				regDate: parseDate(program.regDate),
				startTerm: program.startTerm || '',
				structureId: program.structureId.toString(),
				graduationDate: parseDate(program.graduationDate),
				status: program.status,
				reasons: '',
			});
			setPendingFiles([]);
			setShowReasonWarning(false);
			setPendingSubmit(false);
		}
	}, [opened, program, form.setValues]);

	const executeSubmit = useCallback(
		async (values: typeof form.values) => {
			setIsSubmitting(true);
			try {
				const attachments: AuditAttachmentInfo[] = [];
				for (const file of pendingFiles) {
					const fd = new FormData();
					fd.append('file', file);
					attachments.push(unwrap(await uploadAuditAttachment(fd)));
				}

				await updateStudentProgram(
					program.id,
					{
						intakeDate: formatDateToISO(values.intakeDate) || null,
						regDate: formatDateToISO(values.regDate) || null,
						startTerm: values.startTerm || null,
						structureId: parseInt(values.structureId, 10),
						graduationDate: formatDateToISO(values.graduationDate) || null,
						status: values.status as StudentProgramStatus,
					},
					program.stdNo,
					values.reasons,
					attachments.length > 0 ? attachments : undefined
				);

				form.reset();
				setPendingFiles([]);
				close();
			} catch (error) {
				notifications.show({
					title: 'Error',
					message: `Failed to update student program: ${error}`,
					color: 'red',
				});
			} finally {
				setIsSubmitting(false);
				setShowReasonWarning(false);
				setPendingSubmit(false);
			}
		},
		[program.id, form, close, program.stdNo, pendingFiles]
	);

	const handleSubmit = useCallback(
		async (values: typeof form.values) => {
			const hasReasons = !isRichTextEmpty(values.reasons);
			if (!hasReasons && pendingFiles.length === 0 && !pendingSubmit) {
				setShowReasonWarning(true);
				setPendingSubmit(true);
				return;
			}
			await executeSubmit(values);
		},
		[executeSubmit, pendingSubmit, pendingFiles.length]
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
				title='Edit Student Program'
				size='xl'
				onClick={(e) => e.stopPropagation()}
			>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Tabs defaultValue='details'>
						<Tabs.List>
							<Tabs.Tab value='details'>Details</Tabs.Tab>
							<Tabs.Tab value='reasons'>Reasons</Tabs.Tab>
							<Tabs.Tab value='history'>History</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value='details' pt='md'>
							<Stack>
								<Select
									label='Status'
									placeholder='Select status'
									searchable
									clearable
									data={programStatus.enumValues.map((s) => ({
										value: s,
										label: s,
									}))}
									required
									{...form.getInputProps('status')}
								/>
								<Select
									label='Structure'
									placeholder='Select structure'
									searchable
									clearable
									data={structuresData}
									required
									disabled={isLoadingStructures}
									{...form.getInputProps('structureId')}
									rightSection={
										isLoadingStructures ? <Loader size='xs' /> : undefined
									}
								/>
								<Group grow>
									<DateInput
										label='Intake Date'
										placeholder='Select intake date'
										clearable
										{...form.getInputProps('intakeDate')}
									/>
									<DateInput
										label='Registration Date'
										placeholder='Select registration date'
										clearable
										{...form.getInputProps('regDate')}
									/>
								</Group>
								<Select
									label='Start Term'
									placeholder='Select start term'
									searchable
									clearable
									data={termsData}
									disabled={isLoadingTerms}
									{...form.getInputProps('startTerm')}
									rightSection={
										isLoadingTerms ? <Loader size='xs' /> : undefined
									}
								/>
								<DateInput
									label='Graduation Date'
									placeholder='Select graduation date'
									clearable
									{...form.getInputProps('graduationDate')}
								/>
							</Stack>
						</Tabs.Panel>

						<Tabs.Panel value='reasons' pt='md'>
							<ReasonsTab
								reasons={form.values.reasons}
								onReasonsChange={(val) => form.setFieldValue('reasons', val)}
								pendingFiles={pendingFiles}
								onAddFile={(file) => {
									if (file) setPendingFiles((prev) => [...prev, file]);
								}}
								onRemoveFile={(i) =>
									setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))
								}
							/>
						</Tabs.Panel>

						<Tabs.Panel value='history' pt='md'>
							<RecordAuditHistory
								tableName='student_programs'
								recordId={program.id}
								fieldLabels={FIELD_LABELS}
								excludeFields={['stdNo']}
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
							disabled={isSubmitting || isLoadingTerms || isLoadingStructures}
						>
							Cancel
						</Button>
						<Button
							type='submit'
							loading={isSubmitting}
							disabled={isLoadingTerms || isLoadingStructures}
						>
							Update
						</Button>
					</Group>
				</form>
			</Modal>
		</>
	);
}
