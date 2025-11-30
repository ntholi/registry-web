'use client';

import {
	ActionIcon,
	Button,
	Group,
	Modal,
	Select,
	Tabs,
	Textarea,
	TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import {
	gender,
	maritalStatusEnum,
	studentStatus,
} from '@/modules/registry/database/schema/enums';
import { updateStudent } from '../server/actions';

interface Student {
	stdNo: number;
	name: string;
	nationalId: string;
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

interface Props {
	student: Student;
}

export default function EditStudentModal({ student }: Props) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

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
		}
	}, [opened, student, form.setValues]);

	const handleSubmit = useCallback(
		async (values: typeof form.values) => {
			setIsSubmitting(true);
			try {
				await updateStudent(
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
					values.reasons
				);

				notifications.show({
					title: 'Success',
					message: 'Student updated successfully',
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
					message: `Failed to update student: ${error}`,
					color: 'red',
				});
			} finally {
				setIsSubmitting(false);
			}
		},
		[student.stdNo, form, close, queryClient]
	);

	return (
		<>
			<ActionIcon size='sm' variant='subtle' color='dimmed' onClick={open}>
				<IconEdit size='1rem' />
			</ActionIcon>
			<Modal opened={opened} onClose={close} title='Edit Student' size='lg'>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Tabs defaultValue='details'>
						<Tabs.List>
							<Tabs.Tab value='details'>Details</Tabs.Tab>
							<Tabs.Tab value='contact'>Contact</Tabs.Tab>
							<Tabs.Tab value='personal'>Personal</Tabs.Tab>
							<Tabs.Tab value='reasons'>Reasons</Tabs.Tab>
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
								firstDayOfWeek={0}
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

							<TextInput
								label='Country'
								placeholder='Enter country'
								mb='md'
								{...form.getInputProps('country')}
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

							<TextInput
								label='Race'
								placeholder='Enter race'
								mb='md'
								{...form.getInputProps('race')}
							/>

							<TextInput
								label='Religion'
								placeholder='Enter religion'
								mb='md'
								{...form.getInputProps('religion')}
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
