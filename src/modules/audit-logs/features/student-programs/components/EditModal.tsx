'use client';

import {
	ActionIcon,
	Button,
	Group,
	Modal,
	Select,
	Tabs,
	Textarea,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { getAllTerms } from '@registry/terms';
import { IconEdit } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import {
	programStatus,
	type StudentProgramStatus,
} from '@/modules/registry/database/schema/enums';
import { getStructures, updateStudentProgram } from '../server/actions';

// Helper functions to convert between Date and string format (YYYY-MM-DD)
function parseDate(dateString: string | null): Date | null {
	if (!dateString) return null;
	const date = new Date(dateString);
	return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date: Date | null | undefined): string | null {
	if (!date) return null;
	// Handle case where date might already be a string
	if (typeof date === 'string') return date;
	// Ensure it's a valid Date object
	if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

interface StudentProgram {
	id: number;
	stdNo: number;
	intakeDate: string | null;
	regDate: string | null;
	startTerm: string | null;
	structureId: number;
	graduationDate: string | null;
	status: StudentProgramStatus;
}

interface Props {
	program: StudentProgram;
}

export default function EditStudentProgramModal({ program }: Props) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [terms, setTerms] = useState<{ value: string; label: string }[]>([]);
	const [structures, setStructures] = useState<
		{ value: string; label: string }[]
	>([]);

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
		if (!opened) return;

		async function loadData() {
			try {
				const [termsData, structuresData] = await Promise.all([
					getAllTerms(),
					getStructures(),
				]);

				setTerms(
					termsData.map((t) => ({
						value: t.name,
						label: t.name,
					}))
				);

				setStructures(
					structuresData.map((s) => ({
						value: s.id.toString(),
						label: `${s.program?.code} - ${s.code}${s.desc ? ` (${s.desc})` : ''}`,
					}))
				);
			} catch (_error) {
				notifications.show({
					title: 'Error',
					message: 'Failed to load data for the form',
					color: 'red',
				});
			}
		}

		loadData();
	}, [opened]);

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
		}
	}, [opened, program, form.setValues]);

	const handleSubmit = useCallback(
		async (values: typeof form.values) => {
			setIsSubmitting(true);
			try {
				await updateStudentProgram(
					program.id,
					{
						intakeDate: formatDate(values.intakeDate),
						regDate: formatDate(values.regDate),
						startTerm: values.startTerm || null,
						structureId: parseInt(values.structureId, 10),
						graduationDate: formatDate(values.graduationDate),
						status: values.status as StudentProgramStatus,
					},
					values.reasons
				);

				notifications.show({
					title: 'Success',
					message: 'Student program updated successfully',
					color: 'green',
				});

				queryClient.invalidateQueries({
					queryKey: ['student'],
				});

				form.reset();
				close();
			} catch (error) {
				notifications.show({
					title: 'Error',
					message: `Failed to update student program: ${error}`,
					color: 'red',
				});
			} finally {
				setIsSubmitting(false);
			}
		},
		[program.id, form, close, queryClient]
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
				className='edit-program-icon'
			>
				<IconEdit size='1rem' />
			</ActionIcon>
			<Modal
				opened={opened}
				onClose={close}
				title='Edit Student Program'
				size='lg'
			>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Tabs defaultValue='details'>
						<Tabs.List>
							<Tabs.Tab value='details'>Details</Tabs.Tab>
							<Tabs.Tab value='reasons'>Reasons</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value='details' pt='md'>
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
								mb='md'
								{...form.getInputProps('status')}
							/>

							<Select
								label='Structure'
								placeholder='Select structure'
								searchable
								clearable
								data={structures}
								required
								mb='md'
								{...form.getInputProps('structureId')}
							/>

							<Group grow mb='md'>
								<Select
									label='Start Term'
									placeholder='Select start term'
									searchable
									clearable
									data={terms}
									{...form.getInputProps('startTerm')}
								/>

								<DateInput
									label='Intake Date'
									placeholder='Select intake date'
									clearable
									valueFormat='YYYY-MM-DD'
									{...form.getInputProps('intakeDate')}
								/>
							</Group>

							<DateInput
								label='Registration Date'
								placeholder='Select registration date'
								clearable
								valueFormat='YYYY-MM-DD'
								mb='md'
								{...form.getInputProps('regDate')}
							/>

							<DateInput
								label='Graduation Date'
								placeholder='Select graduation date'
								clearable
								valueFormat='YYYY-MM-DD'
								mb='md'
								{...form.getInputProps('graduationDate')}
							/>
						</Tabs.Panel>

						<Tabs.Panel value='reasons' pt='md'>
							<Textarea
								label='Reasons for Update'
								placeholder='Enter the reason for this update (optional)'
								rows={6}
								{...form.getInputProps('reasons')}
							/>
						</Tabs.Panel>
					</Tabs>

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
