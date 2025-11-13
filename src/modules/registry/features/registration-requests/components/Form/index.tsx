'use client';

import {
	ActionIcon,
	Divider,
	Group,
	Paper,
	Select,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useCallback, useEffect, useState } from 'react';
import StdNoInput from '@/app/dashboard/base/StdNoInput';
import {
	type modules,
	type StudentModuleStatus,
	type semesterModules,
	studentModuleStatus,
} from '@/core/database/schema';
import { getModulesForStructure } from '@/modules/academic/features/semester-modules/server/actions';
import {
	determineSemesterStatus,
	getStudentSemesterModules,
} from '@/modules/registry/features/registration-requests/server/requests/actions';
import { getStudentRegistrationData } from '@/modules/registry/features/students/server/actions';
import { findAllTerms } from '@/modules/registry/features/terms/server/actions';
import { useCurrentTerm } from '@/shared/lib/hooks/use-current-term';
import { getAcademicRemarks } from '@/shared/lib/utils/grades';
import { formatSemester } from '@/shared/lib/utils/utils';
import { Form } from '@/shared/ui/adease';
import ModulesDialog from './ModulesDialog';
import SponsorInput from './SponsorInput';

type Module = typeof modules.$inferSelect;

type SemesterModule = typeof semesterModules.$inferSelect & {
	semesterNumber?: string;
	semesterName?: string;
	module: Module;
};

interface SelectedModule extends SemesterModule {
	status: StudentModuleStatus;
	semesterNumber?: string;
	semesterName?: string;
}

type RegistrationRequest = {
	id?: number;
	stdNo: number;
	semesterStatus: 'Active' | 'Repeat';
	sponsorId: number;
	borrowerNo?: string;
	bankName?: string;
	accountNumber?: string;
	semesterNumber: string;
	termId: number;
	selectedModules?: Array<SelectedModule>;
};

type Props = {
	onSubmit: (values: RegistrationRequest) => Promise<RegistrationRequest>;
	defaultValues?: RegistrationRequest;
	onError?: (
		error: Error | React.SyntheticEvent<HTMLDivElement, Event>
	) => void;
	title?: string;
	structureModules?: Awaited<ReturnType<typeof getModulesForStructure>>;
	structureId?: number;
	initialStdNo?: number;
};

type MinimalForm = {
	setFieldValue: (field: string, value: unknown) => void;
	values: Record<string, unknown>;
	getInputProps?: (field: string) => unknown;
};

function FormBinder({
	form,
	onReady,
}: {
	form: unknown;
	onReady: (form: MinimalForm) => void;
}) {
	useEffect(() => {
		onReady(form as MinimalForm);
	}, [form, onReady]);
	return null;
}

export default function RegistrationRequestForm({
	onSubmit,
	defaultValues,
	title,
	structureModules: initialStructureModules,
	structureId: initialStructureId,
	initialStdNo,
}: Props) {
	const router = useRouter();
	const [structureId, setStructureId] = useState<number | null>(
		initialStructureId ?? null
	);

	const { currentTerm } = useCurrentTerm();
	const { data: allTerms = [] } = useQuery({
		queryKey: ['allTerms'],
		queryFn: async () => await findAllTerms(),
		select: (terms) => {
			console.log('Terms fetched:', terms);
			return terms.items;
		},
	});

	const { data: structureModules, isLoading } = useQuery({
		queryKey: ['structureModules', structureId],
		queryFn: async () => {
			if (structureId) {
				return getModulesForStructure(structureId);
			}
			return [];
		},
		enabled: !!structureId && !initialStructureModules,
		initialData: initialStructureModules,
	});

	const semesterOptions = structureModules
		? [...new Set(structureModules.map((sem) => sem.id.toString()))]
				.map((id) => {
					const semester = structureModules.find((s) => s.id.toString() === id);
					const semNum = semester?.semesterNumber;
					if (!semNum) return { value: '', label: '' };
					return {
						value: String(semNum),
						label: formatSemester(semNum),
					};
				})
				.filter((opt) => opt.value !== '')
		: [];

	const filteredModules = structureModules
		? (structureModules.flatMap((sem) =>
				sem.semesterModules
					.filter((module) => module.module !== null)
					.map((module) => ({
						...module,
						semesterNumber: sem.semesterNumber,
						semesterName: sem.name,
					}))
			) as SemesterModule[])
		: [];

	const handleStudentSelect = useCallback(async (stdNo: number) => {
		if (stdNo) {
			try {
				const student = await getStudentRegistrationData(stdNo);
				if (student && student.programs.length > 0) {
					const activeProgram = student.programs.find(
						(p) => p.status === 'Active'
					);
					if (activeProgram) {
						setStructureId(activeProgram.structureId);
					} else {
						setStructureId(null);
					}
				} else {
					setStructureId(null);
				}
			} catch (error) {
				console.error('Error fetching student:', error);
				setStructureId(null);
			}
		} else {
			setStructureId(null);
		}
	}, []);

	const handleLoadModules = useCallback(
		// biome-ignore lint/suspicious/noExplicitAny: form type from Mantine is complex
		async (stdNo: number, form: any) => {
			if (!stdNo || !structureId) return;

			try {
				const student = await getStudentRegistrationData(stdNo);
				if (!student) {
					console.error('Student not found');
					return;
				}

				const academicRemarks = getAcademicRemarks(student.programs);
				const semesterData = await getStudentSemesterModules(
					student,
					academicRemarks
				);

				if (semesterData.error) {
					console.error('Error loading student modules:', semesterData.error);
					return;
				}

				const mappedModules = semesterData.modules.map((moduleData) => ({
					id: moduleData.semesterModuleId,
					type: moduleData.type,
					credits: moduleData.credits,
					status: moduleData.status as StudentModuleStatus,
					semesterModuleId: moduleData.semesterModuleId,
					semesterNumber: moduleData.semesterNo,
					semesterName: `Semester ${moduleData.semesterNo}`,
					module: {
						id: moduleData.semesterModuleId,
						code: moduleData.code,
						name: moduleData.name,
					},
				}));

				const { semesterNo, status } = await determineSemesterStatus(
					semesterData.modules as Parameters<typeof determineSemesterStatus>[0],
					student
				);

				form.setFieldValue('selectedModules', mappedModules);
				form.setFieldValue('semesterNumber', semesterNo.toString());
				form.setFieldValue('semesterStatus', status);
			} catch (error) {
				console.error('Error loading student modules:', error);
			}
		},
		[structureId]
	);

	const [formInstance, setFormInstance] = useState<MinimalForm | null>(null);

	useEffect(() => {
		if (initialStdNo && !defaultValues && formInstance) {
			handleStudentSelect(initialStdNo);
			const timer = setTimeout(() => {
				handleLoadModules(initialStdNo, formInstance);
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [
		initialStdNo,
		defaultValues,
		formInstance,
		handleLoadModules,
		handleStudentSelect,
	]);

	return (
		<Form
			title={title}
			action={(values: RegistrationRequest) => onSubmit(values)}
			queryKey={['registrationRequests']}
			defaultValues={{
				...defaultValues,
				stdNo: initialStdNo || defaultValues?.stdNo,
				selectedModules: defaultValues?.selectedModules || [],
				semesterNumber: defaultValues?.semesterNumber?.toString(),
				termId: defaultValues?.termId || currentTerm?.id || '',
			}}
			onSuccess={({ id }) => {
				router.push(`/registration/requests/pending/${id}`);
			}}
		>
			{(form) => {
				const selectedModules = form.values.selectedModules || [];

				const handleFormReady = (f: MinimalForm) => {
					if (!formInstance) setFormInstance(f);
				};

				const handleAddModuleToForm = async (module: SemesterModule) => {
					// Determine the correct status based on student's history
					let moduleStatus: StudentModuleStatus = 'Compulsory';

					// Get current form value for student number
					const stdNo = form.values.stdNo;

					if (stdNo && module.module) {
						try {
							// Get student data to check attempt history
							const student = await getStudentRegistrationData(stdNo);
							if (student) {
								// Count how many times this module has been attempted
								const allStudentModules = student.programs
									.flatMap((p) => p.semesters)
									.filter((s) => s.status !== 'Deleted')
									.flatMap((s) => s.studentModules)
									.filter((m) => m.status !== 'Drop' && m.status !== 'Delete');

								const attempts = allStudentModules.filter(
									(sm) => sm.semesterModule.module?.name === module.module?.name
								);

								if (attempts.length > 0) {
									// This is a repeat module - determine the next attempt number
									const nextAttemptNumber = attempts.length + 1;
									moduleStatus =
										`Repeat${nextAttemptNumber}` as StudentModuleStatus;
								} else {
									// First time attempting this module
									moduleStatus = 'Compulsory';
								}
							}
						} catch (error) {
							console.error(
								'Error fetching student data for module status:',
								error
							);
							// Fallback to compulsory status
							moduleStatus = 'Compulsory';
						}
					}

					const newModule: SelectedModule = {
						...module,
						status: moduleStatus,
					};
					if (!selectedModules.some((m) => m.id === newModule.id)) {
						form.setFieldValue('selectedModules', [
							...selectedModules,
							newModule,
						]);
					}
				};

				const handleRemoveModule = (moduleId: number) => {
					form.setFieldValue(
						'selectedModules',
						selectedModules.filter((m: SelectedModule) => m.id !== moduleId)
					);
				};

				const handleChangeModuleStatus = (
					moduleId: number,
					newStatus: StudentModuleStatus
				) => {
					form.setFieldValue(
						'selectedModules',
						selectedModules.map((module: SelectedModule) =>
							module.id === moduleId ? { ...module, status: newStatus } : module
						)
					);
				};

				return (
					<Stack gap='xs'>
						<FormBinder form={form} onReady={handleFormReady} />
						<StdNoInput
							{...form.getInputProps('stdNo')}
							disabled={!!defaultValues || !!initialStdNo}
							onChange={(value: string | number) => {
								form.getInputProps('stdNo').onChange(value);
								if (value) handleStudentSelect(Number(value));
							}}
						/>

						<Select
							label='Term'
							placeholder='Select term'
							data={allTerms.map((term) => ({
								value: term.id.toString(),
								label: term.name,
							}))}
							{...form.getInputProps('termId')}
							onChange={(value: string | null) => {
								form.setFieldValue('termId', Number(value));
							}}
							required
						/>

						<Group grow>
							<Select
								label='Semester'
								placeholder='Select semester'
								data={semesterOptions}
								{...form.getInputProps('semesterNumber')}
								onChange={(value: string | null) => {
									form.setFieldValue('semesterNumber', value || '');
								}}
								disabled={!structureId || semesterOptions.length === 0}
								required
							/>

							<Select
								label='Semester Status'
								data={[
									{ value: 'Active', label: 'Active' },
									{ value: 'Repeat', label: 'Repeat' },
								]}
								{...form.getInputProps('semesterStatus')}
								disabled={!structureId}
							/>
						</Group>

						<SponsorInput
							sponsorId={Number(form.values.sponsorId)}
							borrowerNo={form.values.borrowerNo}
							bankName={form.values.bankName}
							accountNumber={form.values.accountNumber}
							onSponsorChange={(value) =>
								form.setFieldValue('sponsorId', value)
							}
							onBorrowerNoChange={(value) =>
								form.setFieldValue('borrowerNo', value)
							}
							onBankNameChange={(value) =>
								form.setFieldValue('bankName', value)
							}
							onAccountNumberChange={(value) =>
								form.setFieldValue('accountNumber', value)
							}
							disabled={!structureId}
						/>

						<Paper withBorder p='md' mt='md'>
							<Group justify='space-between' mb='md'>
								<Text fw={500}>Modules</Text>
								<ModulesDialog
									onAddModule={handleAddModuleToForm}
									modules={filteredModules}
									isLoading={isLoading}
									selectedModules={selectedModules}
									disabled={
										!structureId || !structureId || !form.values.semesterNumber
									}
								/>
							</Group>
							<Divider my='xs' />
							<Table striped highlightOnHover>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>Code</Table.Th>
										<Table.Th>Name</Table.Th>
										<Table.Th>Type</Table.Th>
										<Table.Th>Credits</Table.Th>
										<Table.Th>Status</Table.Th>
										<Table.Th>Action</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{selectedModules.length === 0 ? (
										<Table.Tr>
											<Table.Td colSpan={6} align='center'>
												<Text c='dimmed' size='sm'>
													No modules selected
												</Text>
											</Table.Td>
										</Table.Tr>
									) : (
										selectedModules.map((semModule: SelectedModule) => (
											<Table.Tr key={semModule.id}>
												<Table.Td>{semModule.module.code}</Table.Td>
												<Table.Td>{semModule.module.name}</Table.Td>
												<Table.Td>{semModule.type}</Table.Td>
												<Table.Td>{semModule.credits}</Table.Td>
												<Table.Td>
													<Select
														value={semModule.status}
														onChange={(value) =>
															handleChangeModuleStatus(
																semModule.id,
																value as StudentModuleStatus
															)
														}
														data={studentModuleStatus.enumValues.map(
															(status) => ({
																value: status,
																label: status,
															})
														)}
														size='xs'
														style={{ width: '120px' }}
														disabled={!structureId}
													/>
												</Table.Td>
												<Table.Td>
													<ActionIcon
														color='red'
														onClick={() => handleRemoveModule(semModule.id)}
														disabled={!structureId}
													>
														<IconTrash size='1rem' />
													</ActionIcon>
												</Table.Td>
											</Table.Tr>
										))
									)}
								</Table.Tbody>
							</Table>
						</Paper>
					</Stack>
				);
			}}
		</Form>
	);
}
