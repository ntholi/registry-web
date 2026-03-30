'use client';

import RecordAuditHistory from '@audit-logs/_components/RecordAuditHistory';
import {
	ActionIcon,
	type ActionIconProps,
	Alert,
	Box,
	Button,
	Group,
	Loader,
	Modal,
	Select,
	Tabs,
	Text,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	type Grade,
	grade,
	type StudentModuleStatus,
	studentModuleStatus,
} from '@registry/_database';
import { IconAlertCircle, IconEdit } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { unwrap } from '@/shared/lib/actions/actionResult';
import { isRichTextEmpty } from '@/shared/lib/utils/files';
import { getLetterGrade } from '@/shared/lib/utils/grades';
import type { AuditAttachmentInfo } from '../../_server/actions';
import {
	canEditMarksAndGrades,
	updateStudentModule,
	uploadAuditAttachment,
} from '../../_server/actions';
import ReasonsTab from '../shared/ReasonsTab';
import AdvancedTab from './AdvancedTab';

interface StudentModule {
	id: number;
	code: string;
	name: string;
	status: StudentModuleStatus;
	marks: string;
	grade: Grade;
}

type Props = {
	module: StudentModule;
	stdNo: number;
} & ActionIconProps;

const FIELD_LABELS: Record<string, string> = {
	status: 'Status',
	marks: 'Marks',
	grade: 'Grade',
	moduleCode: 'Module Code',
	moduleName: 'Module Name',
};

export default function EditStudentModuleModal({
	module,
	stdNo,
	...rest
}: Props) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showReasonWarning, setShowReasonWarning] = useState(false);
	const [pendingSubmit, setPendingSubmit] = useState(false);
	const [pendingFiles, setPendingFiles] = useState<File[]>([]);

	const { data: canEditMarks = false, isLoading: isLoadingPermissions } =
		useQuery({
			queryKey: ['can-edit-marks'],
			queryFn: canEditMarksAndGrades,
			staleTime: 1000 * 60 * 15,
			enabled: opened,
		});

	const form = useForm({
		initialValues: {
			status: module.status,
			marks: module.marks,
			grade: module.grade,
			reasons: '',
		},
	});

	useEffect(() => {
		if (opened) {
			form.setValues({
				status: module.status,
				marks: module.marks,
				grade: module.grade,
				reasons: '',
			});
			setPendingFiles([]);
			setShowReasonWarning(false);
			setPendingSubmit(false);
		}
	}, [opened, module, form.setValues]);

	const handleMarksChange = useCallback(
		(value: string) => {
			form.setFieldValue('marks', value);
			const numericMarks = Number.parseFloat(value);
			if (
				!Number.isNaN(numericMarks) &&
				numericMarks >= 0 &&
				numericMarks <= 100
			) {
				const determinedGrade =
					numericMarks === 50
						? 'PX'
						: numericMarks === 0
							? 'NM'
							: getLetterGrade(numericMarks);
				form.setFieldValue('grade', determinedGrade as Grade);
			}
		},
		[form]
	);

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

				await updateStudentModule(
					module.id,
					{
						status: values.status as StudentModuleStatus,
						marks: values.marks,
						grade: values.grade as Grade,
					},
					stdNo,
					values.reasons,
					attachments.length > 0 ? attachments : undefined
				);

				notifications.show({
					title: 'Success',
					message: 'Student module updated successfully',
					color: 'green',
				});

				queryClient.invalidateQueries({ queryKey: ['student'] });
				queryClient.invalidateQueries({
					queryKey: ['audit-history', 'student_modules', String(module.id)],
				});

				form.reset();
				setPendingFiles([]);
				close();
			} catch (error) {
				notifications.show({
					title: 'Error',
					message: `Failed to update student module: ${error}`,
					color: 'red',
				});
			} finally {
				setIsSubmitting(false);
				setShowReasonWarning(false);
				setPendingSubmit(false);
			}
		},
		[module.id, form, close, queryClient, stdNo, pendingFiles]
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
				size='sm'
				variant='subtle'
				color='gray'
				onClick={open}
				style={{
					opacity: 0,
					transition: 'opacity 0.2s',
				}}
				className='edit-module-icon'
				{...rest}
			>
				<IconEdit size='1rem' />
			</ActionIcon>
			<Modal
				opened={opened}
				onClose={close}
				title={
					<Box>
						<Box style={{ fontWeight: 600 }}>Edit Student Module</Box>
						<Text size='sm' c='dimmed' mt='xs'>
							{module.code} - {module.name}
						</Text>
					</Box>
				}
				size={550}
			>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Tabs defaultValue='details'>
						<Tabs.List>
							<Tabs.Tab value='details'>Details</Tabs.Tab>
							<Tabs.Tab value='reasons'>Reasons</Tabs.Tab>
							<Tabs.Tab value='advanced'>Advanced</Tabs.Tab>
							<Tabs.Tab value='history'>History</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value='details' pt='md'>
							<Select
								label='Status'
								placeholder='Select status'
								searchable
								data={studentModuleStatus.enumValues.map((s) => ({
									value: s,
									label: s,
								}))}
								required
								mb='md'
								{...form.getInputProps('status')}
							/>
							<Group grow>
								<TextInput
									label='Marks'
									placeholder='Enter marks'
									required
									mb='md'
									disabled={!canEditMarks || isLoadingPermissions}
									value={form.values.marks}
									onChange={(event) =>
										handleMarksChange(event.currentTarget.value)
									}
									error={form.errors.marks}
									rightSection={
										isLoadingPermissions ? <Loader size='xs' /> : undefined
									}
								/>
								<Select
									label='Grade'
									placeholder='Select grade'
									searchable
									clearable
									data={grade.enumValues.map((g) => ({
										value: g,
										label: g,
									}))}
									required
									mb='md'
									disabled={!canEditMarks || isLoadingPermissions}
									{...form.getInputProps('grade')}
									rightSection={
										isLoadingPermissions ? <Loader size='xs' /> : undefined
									}
								/>
							</Group>
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
						<Tabs.Panel value='advanced' pt='md'>
							<AdvancedTab
								studentModuleId={module.id}
								stdNo={stdNo}
								onSuccess={close}
							/>
						</Tabs.Panel>

						<Tabs.Panel value='history' pt='md'>
							<RecordAuditHistory
								tableName='student_modules'
								recordId={module.id}
								fieldLabels={FIELD_LABELS}
								excludeFields={['studentSemesterId', 'moduleId']}
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
							disabled={isSubmitting || isLoadingPermissions}
						>
							Cancel
						</Button>
						<Button
							type='submit'
							loading={isSubmitting}
							disabled={isLoadingPermissions}
						>
							Update
						</Button>
					</Group>
				</form>
			</Modal>
		</>
	);
}
