'use client';

import RecordAuditHistory from '@audit-logs/_components/RecordAuditHistory';
import {
	ActionIcon,
	Alert,
	Button,
	Group,
	Modal,
	Select,
	Tabs,
	TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { gender, maritalStatusEnum, studentStatus } from '@registry/_database';
import { IconAlertCircle, IconEdit } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { unwrap } from '@/shared/lib/actions/actionResult';
import { getRaceByCountry, getRaces } from '@/shared/lib/utils/countries';
import { getReligions } from '@/shared/lib/utils/religions';
import CountrySelect from '@/shared/ui/CountrySelect';
import type { AuditAttachmentInfo } from '../../_server/actions';
import {
	updateStudentWithReasons,
	uploadAuditAttachment,
} from '../../_server/actions';
import ReasonsTab from '../shared/ReasonsTab';

interface Student {
	stdNo: number;
	name: string;
	nationalId: string | null;
	status: string;
	dateOfBirth: Date | null;
	phone1: string | null;
	phone2: string | null;
	gender: string | null;
	maritalStatus: string | null;
	country: string | null;
	race: string | null;
	nationality: string | null;
	birthPlace: string | null;
	religion: string | null;
}

type Props = {
	student: Student;
};

const FIELD_LABELS: Record<string, string> = {
	name: 'Full Name',
	nationalId: 'National ID',
	status: 'Status',
	dateOfBirth: 'Date of Birth',
	phone1: 'Primary Phone',
	phone2: 'Secondary Phone',
	gender: 'Gender',
	maritalStatus: 'Marital Status',
	country: 'Country',
	race: 'Race',
	nationality: 'Nationality',
	birthPlace: 'Birth Place',
	religion: 'Religion',
};

export default function EditStudentModal({ student }: Props) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showReasonWarning, setShowReasonWarning] = useState(false);
	const [pendingSubmit, setPendingSubmit] = useState(false);
	const [pendingFiles, setPendingFiles] = useState<File[]>([]);

	const form = useForm({
		initialValues: {
			name: student.name,
			nationalId: student.nationalId,
			status: student.status,
			dateOfBirth: student.dateOfBirth,
			phone1: student.phone1 || '',
			phone2: student.phone2 || '',
			gender: student.gender || '',
			maritalStatus: student.maritalStatus || '',
			country: student.country || '',
			race: student.race || '',
			nationality: student.nationality || '',
			birthPlace: student.birthPlace || '',
			religion: student.religion || '',
			reasons: '',
		},
	});

	useEffect(() => {
		if (opened) {
			form.setValues({
				name: student.name,
				nationalId: student.nationalId,
				status: student.status,
				dateOfBirth: student.dateOfBirth,
				phone1: student.phone1 || '',
				phone2: student.phone2 || '',
				gender: student.gender || '',
				maritalStatus: student.maritalStatus || '',
				country: student.country || '',
				race: student.race || '',
				nationality: student.nationality || '',
				birthPlace: student.birthPlace || '',
				religion: student.religion || '',
				reasons: '',
			});
			setPendingFiles([]);
			setShowReasonWarning(false);
			setPendingSubmit(false);
		}
	}, [opened, student, form.setValues]);

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

				await updateStudentWithReasons(
					student.stdNo,
					{
						name: values.name,
						nationalId: values.nationalId,
						status: values.status as (typeof studentStatus.enumValues)[number],
						dateOfBirth: values.dateOfBirth,
						phone1: values.phone1 || null,
						phone2: values.phone2 || null,
						gender: values.gender as (typeof gender.enumValues)[number] | null,
						maritalStatus: values.maritalStatus as
							| (typeof maritalStatusEnum.enumValues)[number]
							| null,
						country: values.country || null,
						race: values.race || null,
						nationality: values.nationality || null,
						birthPlace: values.birthPlace || null,
						religion: values.religion || null,
					},
					values.reasons,
					attachments.length > 0 ? attachments : undefined
				);

				notifications.show({
					title: 'Success',
					message: 'Student updated successfully',
					color: 'green',
				});

				queryClient.invalidateQueries({ queryKey: ['student'] });
				queryClient.invalidateQueries({
					queryKey: ['audit-history', 'students', String(student.stdNo)],
				});

				form.reset();
				setPendingFiles([]);
				close();
			} catch (error) {
				notifications.show({
					title: 'Error',
					message: `Failed to update student: ${error}`,
					color: 'red',
				});
			} finally {
				setIsSubmitting(false);
				setShowReasonWarning(false);
				setPendingSubmit(false);
			}
		},
		[student.stdNo, form, close, queryClient, pendingFiles]
	);

	const handleSubmit = useCallback(
		async (values: typeof form.values) => {
			const hasReasons = values.reasons.trim() && values.reasons !== '<p></p>';
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
			<ActionIcon size='sm' variant='subtle' color='dimmed' onClick={open}>
				<IconEdit size='1rem' />
			</ActionIcon>
			<Modal opened={opened} onClose={close} title='Edit Student' size='xl'>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Tabs defaultValue='details'>
						<Tabs.List>
							<Tabs.Tab value='details'>Details</Tabs.Tab>
							<Tabs.Tab value='contact'>Contact</Tabs.Tab>
							<Tabs.Tab value='personal'>Personal</Tabs.Tab>
							<Tabs.Tab value='reasons'>Reasons</Tabs.Tab>
							<Tabs.Tab value='history'>History</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value='details' pt='md'>
							<TextInput
								label='Full Name'
								placeholder='Enter full name'
								required
								mb='md'
								{...form.getInputProps('name')}
							/>
							<TextInput
								label='National ID'
								placeholder='Enter national ID'
								required
								mb='md'
								{...form.getInputProps('nationalId')}
							/>
							<Select
								label='Status'
								placeholder='Select status'
								searchable
								clearable
								data={studentStatus.enumValues.map((s) => ({
									value: s,
									label: s,
								}))}
								required
								mb='md'
								{...form.getInputProps('status')}
							/>
							<DateInput
								label='Date of Birth'
								placeholder='Select date of birth'
								clearable
								mb='md'
								{...form.getInputProps('dateOfBirth')}
							/>
						</Tabs.Panel>

						<Tabs.Panel value='contact' pt='md'>
							<TextInput
								label='Primary Phone'
								placeholder='Enter primary phone number'
								mb='md'
								{...form.getInputProps('phone1')}
							/>
							<TextInput
								label='Secondary Phone'
								placeholder='Enter secondary phone number'
								mb='md'
								{...form.getInputProps('phone2')}
							/>
							<CountrySelect
								label='Country'
								placeholder='Select country'
								clearable
								mb='md'
								{...form.getInputProps('country')}
								onCountryChange={(c) => {
									if (c) {
										form.setFieldValue('nationality', c.nationality);
										const race = getRaceByCountry(c.name);
										if (race) form.setFieldValue('race', race);
									}
								}}
							/>
						</Tabs.Panel>

						<Tabs.Panel value='personal' pt='md'>
							<Select
								label='Gender'
								placeholder='Select gender'
								searchable
								clearable
								data={gender.enumValues.map((g) => ({
									value: g,
									label: g,
								}))}
								mb='md'
								{...form.getInputProps('gender')}
							/>
							<Select
								label='Marital Status'
								placeholder='Select marital status'
								searchable
								clearable
								data={maritalStatusEnum.enumValues.map((m) => ({
									value: m,
									label: m,
								}))}
								mb='md'
								{...form.getInputProps('maritalStatus')}
							/>
							<TextInput
								label='Nationality'
								placeholder='Enter nationality'
								mb='md'
								{...form.getInputProps('nationality')}
							/>
							<TextInput
								label='Birth Place'
								placeholder='Enter birth place'
								mb='md'
								{...form.getInputProps('birthPlace')}
							/>
							<Select
								label='Race'
								placeholder='Select race'
								data={getRaces()}
								searchable
								clearable
								mb='md'
								{...form.getInputProps('race')}
							/>
							<Select
								label='Religion'
								placeholder='Select religion'
								data={getReligions()}
								searchable
								clearable
								mb='md'
								{...form.getInputProps('religion')}
							/>
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
								tableName='students'
								recordId={student.stdNo}
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
						<Button variant='outline' onClick={close} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button type='submit' loading={isSubmitting}>
							Update
						</Button>
					</Group>
				</form>
			</Modal>
		</>
	);
}
