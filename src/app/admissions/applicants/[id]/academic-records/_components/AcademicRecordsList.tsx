'use client';

import { resultClassificationEnum } from '@admissions/_database';
import {
	ActionIcon,
	Badge,
	Button,
	Group,
	Modal,
	NumberInput,
	Select,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type {
	AcademicRecordWithRelations,
	SubjectGradeInput,
} from '../_lib/types';
import { createAcademicRecord, deleteAcademicRecord } from '../_server/actions';
import {
	getActiveSubjects,
	getCertificateTypesForRecords,
} from '../_server/lookups';

type Props = {
	applicantId: string;
	records: AcademicRecordWithRelations[];
};

type CertificateType = {
	id: string;
	name: string;
	lqfLevel: number;
	gradeMappings: { originalGrade: string; standardGrade: string }[];
};

const classificationOptions = resultClassificationEnum.enumValues.map((c) => ({
	value: c,
	label: c,
}));

export default function AcademicRecordsList({ applicantId, records }: Props) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedCertType, setSelectedCertType] =
		useState<CertificateType | null>(null);
	const [subjectGrades, setSubjectGrades] = useState<SubjectGradeInput[]>([]);

	const { data: subjects = [] } = useQuery({
		queryKey: ['subjects-active'],
		queryFn: getActiveSubjects,
	});

	const { data: certificateTypes = [] } = useQuery({
		queryKey: ['certificate-types-lookup'],
		queryFn: getCertificateTypesForRecords,
	});

	const form = useForm({
		initialValues: {
			certificateTypeId: '',
			examYear: new Date().getFullYear(),
			institutionName: '',
			qualificationName: '',
			resultClassification: '',
		},
	});

	const createMutation = useMutation({
		mutationFn: async (values: typeof form.values) => {
			const isLevel4 = selectedCertType?.lqfLevel === 4;
			return createAcademicRecord(
				applicantId,
				{
					certificateTypeId: values.certificateTypeId,
					examYear: values.examYear,
					institutionName: values.institutionName,
					qualificationName: values.qualificationName || null,
					resultClassification: values.resultClassification
						? (values.resultClassification as (typeof resultClassificationEnum.enumValues)[number])
						: null,
					subjectGrades: isLevel4 ? subjectGrades : undefined,
				},
				isLevel4
			);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applicants'] });
			form.reset();
			setSelectedCertType(null);
			setSubjectGrades([]);
			close();
			notifications.show({
				title: 'Success',
				message: 'Academic record created',
				color: 'green',
			});
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteAcademicRecord,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['applicants'] });
			notifications.show({
				title: 'Success',
				message: 'Academic record deleted',
				color: 'green',
			});
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	function handleCertTypeChange(value: string | null) {
		form.setFieldValue('certificateTypeId', value || '');
		const certType = certificateTypes.find((ct) => ct.id === value) as
			| CertificateType
			| undefined;
		setSelectedCertType(certType || null);
		setSubjectGrades([]);
	}

	function addSubjectGrade() {
		setSubjectGrades([...subjectGrades, { subjectId: '', originalGrade: '' }]);
	}

	function removeSubjectGrade(index: number) {
		setSubjectGrades(subjectGrades.filter((_, i) => i !== index));
	}

	function updateSubjectGrade(
		index: number,
		field: keyof SubjectGradeInput,
		value: string
	) {
		const updated = [...subjectGrades];
		updated[index] = { ...updated[index], [field]: value };
		setSubjectGrades(updated);
	}

	function handleClose() {
		form.reset();
		setSelectedCertType(null);
		setSubjectGrades([]);
		close();
	}

	const isLevel4 = selectedCertType?.lqfLevel === 4;
	const subjectOptions = subjects.map((s) => ({
		value: String(s.id),
		label: s.name,
	}));
	const certTypeOptions = certificateTypes.map((ct) => ({
		value: String(ct.id),
		label: `${ct.name} (LQF ${ct.lqfLevel})`,
	}));

	const gradeOptions =
		selectedCertType?.gradeMappings.map((m) => ({
			value: m.originalGrade,
			label: `${m.originalGrade} → ${m.standardGrade}`,
		})) || [];

	return (
		<Stack gap='md'>
			{records.length > 0 ? (
				records.map((record) => (
					<Stack key={record.id} gap='xs'>
						<Group justify='space-between'>
							<Group gap='xs'>
								<Text fw={500}>{record.certificateType.name}</Text>
								<Badge variant='light' size='sm'>
									LQF {record.certificateType.lqfLevel}
								</Badge>
								<Badge variant='outline' size='sm'>
									{record.examYear}
								</Badge>
							</Group>
							<ActionIcon
								color='red'
								variant='subtle'
								onClick={() => deleteMutation.mutate(record.id)}
								loading={deleteMutation.isPending}
							>
								<IconTrash size={16} />
							</ActionIcon>
						</Group>
						<Text size='sm' c='dimmed'>
							{record.institutionName}
						</Text>

						{record.certificateType.lqfLevel === 4 &&
						record.subjectGrades.length > 0 ? (
							<Table>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>Subject</Table.Th>
										<Table.Th>Original Grade</Table.Th>
										<Table.Th>Standard Grade</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{record.subjectGrades.map((sg) => (
										<Table.Tr key={sg.id}>
											<Table.Td>{sg.subject.name}</Table.Td>
											<Table.Td>{sg.originalGrade}</Table.Td>
											<Table.Td>
												<Badge variant='outline' size='sm'>
													{sg.standardGrade}
												</Badge>
											</Table.Td>
										</Table.Tr>
									))}
								</Table.Tbody>
							</Table>
						) : (
							record.certificateType.lqfLevel > 4 && (
								<Group gap='xs'>
									{record.qualificationName && (
										<Text size='sm'>{record.qualificationName}</Text>
									)}
									{record.resultClassification && (
										<Badge variant='light'>{record.resultClassification}</Badge>
									)}
								</Group>
							)
						)}
					</Stack>
				))
			) : (
				<Text size='sm' c='dimmed'>
					No academic records added
				</Text>
			)}

			<Button
				variant='light'
				leftSection={<IconPlus size={16} />}
				onClick={open}
			>
				Add Academic Record
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Add Academic Record'
				size='lg'
			>
				<form
					onSubmit={form.onSubmit((values) => createMutation.mutate(values))}
				>
					<Stack gap='sm'>
						<Select
							label='Certificate Type'
							required
							data={certTypeOptions}
							value={form.values.certificateTypeId}
							onChange={handleCertTypeChange}
						/>
						<NumberInput
							label='Exam Year'
							required
							min={1950}
							max={new Date().getFullYear()}
							{...form.getInputProps('examYear')}
						/>
						<TextInput
							label='Institution Name'
							required
							placeholder='Enter institution name'
							{...form.getInputProps('institutionName')}
						/>

						{selectedCertType && !isLevel4 && (
							<>
								<TextInput
									label='Qualification Name'
									placeholder='e.g., Bachelor of Science'
									{...form.getInputProps('qualificationName')}
								/>
								<Select
									label='Result Classification'
									data={classificationOptions}
									{...form.getInputProps('resultClassification')}
								/>
							</>
						)}

						{selectedCertType && isLevel4 && (
							<Stack gap='xs'>
								<Text fw={500} size='sm'>
									Subject Grades
								</Text>
								{subjectGrades.map((sg, index) => (
									<Group key={index} gap='xs'>
										<Select
											placeholder='Subject'
											data={subjectOptions}
											value={sg.subjectId ? String(sg.subjectId) : ''}
											onChange={(v) =>
												updateSubjectGrade(index, 'subjectId', v || '')
											}
											style={{ flex: 2 }}
										/>
										<Select
											placeholder='Grade'
											data={gradeOptions}
											value={sg.originalGrade}
											onChange={(v) =>
												updateSubjectGrade(index, 'originalGrade', v || '')
											}
											style={{ flex: 1 }}
										/>
										<ActionIcon
											color='red'
											variant='subtle'
											onClick={() => removeSubjectGrade(index)}
										>
											<IconTrash size={16} />
										</ActionIcon>
									</Group>
								))}
								<Button
									variant='light'
									size='xs'
									leftSection={<IconPlus size={14} />}
									onClick={addSubjectGrade}
								>
									Add Subject
								</Button>
							</Stack>
						)}

						<Group justify='flex-end' mt='md'>
							<Button variant='subtle' onClick={handleClose}>
								Cancel
							</Button>
							<Button type='submit' loading={createMutation.isPending}>
								Create
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</Stack>
	);
}
