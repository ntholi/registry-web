'use client';

import type { modules, semesterModules } from '@academic/_database';
import { getModulesForStructure } from '@academic/semester-modules';
import { findAllSponsors } from '@finance/sponsors';
import {
	ActionIcon,
	Box,
	Button,
	Divider,
	Group,
	Modal,
	Paper,
	Select,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { StudentModuleStatus } from '@registry/_database';
import { studentModuleStatus } from '@registry/_database';
import { getStudentRegistrationData } from '@registry/students';
import { IconExternalLink, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'nextjs-toploader/app';
import { useCallback, useEffect, useState } from 'react';
import StdNoInput from '@/app/dashboard/base/StdNoInput';
import { getAllTerms } from '@/app/registry/terms';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';
import { getAcademicRemarks } from '@/shared/lib/utils/grades';
import {
	formatSemester,
	isActiveModule,
	isActiveSemester,
} from '@/shared/lib/utils/utils';
import { Form, ReceiptInput } from '@/shared/ui/adease';
import {
	determineSemesterStatus,
	getStudentSemesterModules,
} from '../_server/requests/actions';
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
	receiptNumber?: string;
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
	tuitionFeeReceipts?: string[];
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
	const [pendingRepeatModule, setPendingRepeatModule] = useState<{
		module: SemesterModule;
		status: StudentModuleStatus;
	} | null>(null);
	const [repeatReceipt, setRepeatReceipt] = useState('');
	const [isTuitionFeeValid, setIsTuitionFeeValid] = useState(true);
	const [
		repeatModalOpened,
		{ open: openRepeatModal, close: closeRepeatModal },
	] = useDisclosure(false);

	const { activeTerm } = useActiveTerm();
	const { data: allTerms = [] } = useQuery({
		queryKey: ['terms'],
		queryFn: async () => await getAllTerms(),
	});

	const { data: structureModules, isLoading } = useQuery({
		queryKey: ['structure-modules', structureId],
		queryFn: async () => {
			if (structureId) {
				return getModulesForStructure(structureId);
			}
			return [];
		},
		enabled: !!structureId && !initialStructureModules,
		initialData: initialStructureModules,
	});

	const { data: sponsors } = useQuery({
		queryKey: ['sponsors'],
		queryFn: () => findAllSponsors(1),
		select: ({ items }) => items,
	});

	const isSelfSponsored = (sponsorId: number) => {
		if (!sponsors) return false;
		return sponsors.find((s) => s.id === sponsorId)?.code === 'PRV';
	};

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

	useEffect(() => {
		if (activeTerm && formInstance && !formInstance.values.termId) {
			formInstance.setFieldValue('termId', activeTerm.id);
		}
	}, [activeTerm, formInstance]);

	return (
		<Form
			title={title}
			action={(values: RegistrationRequest) => {
				if (!isTuitionFeeValid) {
					throw new Error('Please add at least one tuition fee receipt');
				}
				return onSubmit(values);
			}}
			queryKey={['registration-requests']}
			defaultValues={{
				...defaultValues,
				stdNo: initialStdNo || defaultValues?.stdNo,
				selectedModules: defaultValues?.selectedModules || [],
				semesterNumber: defaultValues?.semesterNumber?.toString(),
				termId: defaultValues?.termId || activeTerm?.id || '',
				semesterStatus: defaultValues?.semesterStatus,
				tuitionFeeReceipts: defaultValues?.tuitionFeeReceipts || [],
			}}
			onSuccess={({ id }) => {
				router.push(`/registry/registration/requests/${id}`);
			}}
		>
			{(form) => {
				const selectedModules = form.values.selectedModules || [];

				const handleFormReady = (f: MinimalForm) => {
					if (!formInstance) setFormInstance(f);
				};

				const handleAddModuleToForm = async (module: SemesterModule) => {
					let moduleStatus: StudentModuleStatus = 'Compulsory';

					const stdNo = form.values.stdNo;

					if (stdNo && module.module) {
						try {
							const student = await getStudentRegistrationData(stdNo);
							if (student) {
								const allStudentModules = student.programs
									.filter((p) => p.status === 'Active')
									.flatMap((p) => p.semesters)
									.filter((s) => isActiveSemester(s.status))
									.flatMap((s) => s.studentModules)
									.filter((m) => isActiveModule(m.status));

								const attempts = allStudentModules.filter(
									(sm) => sm.semesterModule.module?.name === module.module?.name
								);

								if (attempts.length > 0) {
									const nextAttemptNumber = attempts.length + 1;
									moduleStatus =
										`Repeat${nextAttemptNumber}` as StudentModuleStatus;
								} else {
									moduleStatus = 'Compulsory';
								}
							}
						} catch (error) {
							console.error(
								'Error fetching student data for module status:',
								error
							);
							moduleStatus = 'Compulsory';
						}
					}

					const sponsorId = Number(form.values.sponsorId);
					const selfSponsored = isSelfSponsored(sponsorId);

					if (moduleStatus.startsWith('Repeat') && !selfSponsored) {
						setPendingRepeatModule({ module, status: moduleStatus });
						setRepeatReceipt('');
						openRepeatModal();
						return;
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

				const handleConfirmRepeatModule = () => {
					if (!pendingRepeatModule || !repeatReceipt.trim()) return;

					const newModule: SelectedModule = {
						...pendingRepeatModule.module,
						status: pendingRepeatModule.status,
						receiptNumber: repeatReceipt.trim(),
					};
					if (!selectedModules.some((m) => m.id === newModule.id)) {
						form.setFieldValue('selectedModules', [
							...selectedModules,
							newModule,
						]);
					}
					closeRepeatModal();
					setPendingRepeatModule(null);
					setRepeatReceipt('');
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

				const handleModuleReceiptChange = (
					moduleId: number,
					receiptNumber: string
				) => {
					form.setFieldValue(
						'selectedModules',
						selectedModules.map((module: SelectedModule) =>
							module.id === moduleId ? { ...module, receiptNumber } : module
						)
					);
				};

				return (
					<Stack gap='xs' justify='stretch'>
						<FormBinder form={form} onReady={handleFormReady} />
						<Group w='100%' align='flex-start' wrap='nowrap'>
							<Box style={{ flex: 1 }}>
								<StdNoInput
									{...form.getInputProps('stdNo')}
									disabled={!!defaultValues || !!initialStdNo}
									onChange={(value: string | number) => {
										form.getInputProps('stdNo').onChange(value);
										if (value) handleStudentSelect(Number(value));
									}}
								/>
							</Box>
							<ActionIcon
								component={Link}
								href={`/registry/students/${form.values.stdNo}`}
								target='_blank'
								mt={25}
								size='lg'
								variant='default'
								disabled={!form.values.stdNo}
							>
								<IconExternalLink size={'1rem'} />
							</ActionIcon>
						</Group>

						<Select
							label='Term'
							placeholder='Select term'
							data={allTerms.map((term) => ({
								value: term.id.toString(),
								label: term.code,
							}))}
							value={form.values.termId ? String(form.values.termId) : null}
							onChange={(value: string | null) => {
								if (value) form.setFieldValue('termId', Number(value));
							}}
							error={form.errors.termId}
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
							tuitionFeeReceipts={form.values.tuitionFeeReceipts || []}
							onTuitionFeeReceiptsChange={(receipts) =>
								form.setFieldValue('tuitionFeeReceipts', receipts)
							}
							onReceiptValidationChange={setIsTuitionFeeValid}
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
										<Table.Th>Status</Table.Th> <Table.Th>Receipt</Table.Th>{' '}
										<Table.Th>Action</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{selectedModules.length === 0 ? (
										<Table.Tr>
											<Table.Td colSpan={7} align='center'>
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
													{semModule.status.startsWith('Repeat') &&
													!isSelfSponsored(Number(form.values.sponsorId)) ? (
														<ReceiptInput
															value={semModule.receiptNumber || ''}
															onChange={(value) =>
																handleModuleReceiptChange(semModule.id, value)
															}
														/>
													) : null}
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

						<Modal
							opened={repeatModalOpened}
							onClose={closeRepeatModal}
							title='Repeat Module Receipt'
							centered
						>
							<Stack gap='md'>
								<Text size='sm'>
									This module is a repeat ({pendingRepeatModule?.status}).
									Please enter the payment receipt number to continue.
								</Text>
								<Text fw={500}>{pendingRepeatModule?.module.module.name}</Text>
								<ReceiptInput
									label='Receipt Number'
									value={repeatReceipt}
									onChange={setRepeatReceipt}
									required
								/>
								<Group justify='flex-end' gap='sm'>
									<Button variant='default' onClick={closeRepeatModal}>
										Cancel
									</Button>
									<Button
										onClick={handleConfirmRepeatModule}
										disabled={!repeatReceipt.trim()}
									>
										Add Module
									</Button>
								</Group>
							</Stack>
						</Modal>
					</Stack>
				);
			}}
		</Form>
	);
}
