'use client';

import { resultClassificationEnum } from '@admissions/_database';
import {
	ActionIcon,
	Badge,
	Button,
	Collapse,
	Group,
	Modal,
	NumberInput,
	Paper,
	Select,
	SimpleGrid,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconCertificate,
	IconChevronDown,
	IconChevronRight,
	IconPlus,
	IconTrash,
} from '@tabler/icons-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import type {
	AcademicRecordWithRelations,
	SubjectGradeInput,
} from '../academic-records/_lib/types';
import {
	createAcademicRecord,
	deleteAcademicRecord,
} from '../academic-records/_server/actions';
import {
	getActiveSubjects,
	getCertificateTypesForRecords,
} from '../academic-records/_server/lookups';

type Props = {
	applicantId: string;
	records: AcademicRecordWithRelations[];
};

type CertificateType = {
	id: number;
	name: string;
	lqfLevel: number;
	gradeMappings: { originalGrade: string; standardGrade: string }[];
};

const classificationOptions = resultClassificationEnum.enumValues.map((c) => ({
	value: c,
	label: c,
}));

export default function AcademicRecordsTab({ applicantId, records }: Props) {
	const router = useRouter();
	const [opened, { open, close }] = useDisclosure(false);
	const [expandedRecords, setExpandedRecords] = useState<Set<number>>(
		new Set()
	);
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
					certificateTypeId: Number(values.certificateTypeId),
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
		onSuccess: () => {
			form.reset();
			setSelectedCertType(null);
			setSubjectGrades([]);
			close();
			router.refresh();
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
		onSuccess: () => {
			router.refresh();
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
		const certType = certificateTypes.find((ct) => ct.id === Number(value)) as
			| CertificateType
			| undefined;
		setSelectedCertType(certType || null);
		setSubjectGrades([]);
	}

	function toggleExpand(id: number) {
		const newExpanded = new Set(expandedRecords);
		if (newExpanded.has(id)) {
			newExpanded.delete(id);
		} else {
			newExpanded.add(id);
		}
		setExpandedRecords(newExpanded);
	}

	function addSubjectGrade() {
		setSubjectGrades([...subjectGrades, { subjectId: 0, originalGrade: '' }]);
	}

	function removeSubjectGrade(index: number) {
		setSubjectGrades(subjectGrades.filter((_, i) => i !== index));
	}

	function updateSubjectGrade(
		index: number,
		field: keyof SubjectGradeInput,
		value: string | number
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
				<Stack gap='sm'>
					{records.map((record) => {
						const isExpanded = expandedRecords.has(record.id);
						const hasGrades =
							record.certificateType.lqfLevel === 4 &&
							record.subjectGrades.length > 0;

						return (
							<Paper key={record.id} p='md' radius='md' withBorder>
								<Stack gap='md'>
									<Group justify='space-between'>
										<Group gap='md'>
											{hasGrades && (
												<ActionIcon
													variant='subtle'
													onClick={() => toggleExpand(record.id)}
												>
													{isExpanded ? (
														<IconChevronDown size={18} />
													) : (
														<IconChevronRight size={18} />
													)}
												</ActionIcon>
											)}
											<IconCertificate size={20} opacity={0.6} />
											<Stack gap={2}>
												<Group gap='xs'>
													<Text fw={600}>{record.certificateType.name}</Text>
													<Badge variant='light' size='sm'>
														LQF {record.certificateType.lqfLevel}
													</Badge>
												</Group>
												<Text size='sm' c='dimmed'>
													{record.institutionName} • {record.examYear}
												</Text>
											</Stack>
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

									{record.certificateType.lqfLevel > 4 && (
										<Group gap='xs'>
											{record.qualificationName && (
												<Text size='sm'>{record.qualificationName}</Text>
											)}
											{record.resultClassification && (
												<Badge variant='light'>
													{record.resultClassification}
												</Badge>
											)}
										</Group>
									)}

									{hasGrades && (
										<Collapse in={isExpanded}>
											<Table striped highlightOnHover withTableBorder mt='sm'>
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
										</Collapse>
									)}
								</Stack>
							</Paper>
						);
					})}
				</Stack>
			) : (
				<Paper p='xl' radius='md' withBorder>
					<Stack align='center' gap='xs'>
						<IconCertificate size={32} opacity={0.3} />
						<Text size='sm' c='dimmed'>
							No academic records added
						</Text>
					</Stack>
				</Paper>
			)}

			<Button
				variant='light'
				leftSection={<IconPlus size={16} />}
				onClick={open}
				w='fit-content'
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
						<SimpleGrid cols={2}>
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
						</SimpleGrid>

						{selectedCertType && !isLevel4 && (
							<SimpleGrid cols={2}>
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
							</SimpleGrid>
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
												updateSubjectGrade(index, 'subjectId', Number(v))
											}
											flex={2}
										/>
										<Select
											placeholder='Grade'
											data={gradeOptions}
											value={sg.originalGrade}
											onChange={(v) =>
												updateSubjectGrade(index, 'originalGrade', v || '')
											}
											flex={1}
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
									w='fit-content'
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
