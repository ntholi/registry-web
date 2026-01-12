'use client';

import type { ReceiptType } from '@finance/_database';
import {
	ActionIcon,
	Box,
	Divider,
	Group,
	Paper,
	Select,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { graduationRequests } from '@registry/_database';
import {
	getAllGraduationDates,
	getLatestGraduationDate,
} from '@registry/graduation/dates';
import { IconExternalLink, IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import Link from 'next/link';
import { useRouter } from 'nextjs-toploader/app';
import { useCallback, useEffect, useState } from 'react';
import StdNoInput from '@/app/dashboard/base/StdNoInput';
import { Form } from '@/shared/ui/adease';
import { getEligiblePrograms } from '../../clearance/_server/requests/actions';

type GraduationRequest = typeof graduationRequests.$inferInsert;

type GraduationDateOption = Awaited<
	ReturnType<typeof getAllGraduationDates>
>[0];

interface PaymentReceiptInput {
	receiptType: ReceiptType;
	receiptNo: string;
}

interface FormValues {
	studentProgramId?: number;
	graduationDateId?: number;
	informationConfirmed?: boolean;
	message?: string;
}

interface SubmissionData extends GraduationRequest {
	stdNo?: number;
	paymentReceipts?: PaymentReceiptInput[];
}

type Props = {
	onSubmit: (values: SubmissionData) => Promise<SubmissionData>;
	defaultValues?: Partial<FormValues>;
	title?: string;
	initialStdNo?: number;
	initialGraduationDateId?: number;
};

type MinimalForm = {
	setFieldValue: (field: string, value: unknown) => void;
	values: Record<string, unknown>;
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

const RECEIPT_TYPE_OPTIONS: { value: ReceiptType; label: string }[] = [
	{ value: 'graduation_gown', label: 'Graduation Gown' },
	{ value: 'graduation_fee', label: 'Graduation Fee' },
];

export default function GraduationRequestForm({
	onSubmit,
	defaultValues,
	title,
	initialStdNo,
	initialGraduationDateId,
}: Props) {
	const router = useRouter();
	const [stdNo, setStdNo] = useState<number | string>(initialStdNo ?? '');
	const [selectedProgramId, setSelectedProgramId] = useState<string>(
		defaultValues?.studentProgramId?.toString() ?? ''
	);
	const [selectedGraduationDateId, setSelectedGraduationDateId] =
		useState<string>(
			initialGraduationDateId?.toString() ??
				defaultValues?.graduationDateId?.toString() ??
				''
		);
	const [formInstance, setFormInstance] = useState<MinimalForm | null>(null);
	const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceiptInput[]>(
		[]
	);
	const [newReceiptType, setNewReceiptType] = useState<string>('');
	const [newReceiptNo, setNewReceiptNo] = useState<string>('');

	const { data: graduationDates = [], isLoading: loadingDates } = useQuery({
		queryKey: ['graduation-dates-all'],
		queryFn: getAllGraduationDates,
	});

	const { data: latestGraduationDate } = useQuery({
		queryKey: ['latest-graduation-date'],
		queryFn: getLatestGraduationDate,
	});

	const { data: eligiblePrograms = [], isLoading: loadingPrograms } = useQuery({
		queryKey: ['eligible-programs-admin', stdNo],
		queryFn: async () => {
			const stdNoNum = Number(stdNo);
			if (Number.isNaN(stdNoNum)) return [];
			return await getEligiblePrograms(stdNoNum);
		},
		enabled: !!stdNo && !Number.isNaN(Number(stdNo)),
	});

	useEffect(() => {
		if (
			latestGraduationDate &&
			!selectedGraduationDateId &&
			!initialGraduationDateId
		) {
			setSelectedGraduationDateId(latestGraduationDate.id.toString());
		}
	}, [latestGraduationDate, selectedGraduationDateId, initialGraduationDateId]);

	useEffect(() => {
		if (eligiblePrograms.length > 0 && !selectedProgramId) {
			const completedProgram = eligiblePrograms.find(
				(p) => p.status === 'Completed'
			);
			if (completedProgram) {
				setSelectedProgramId(completedProgram.id.toString());
			} else {
				setSelectedProgramId(eligiblePrograms[0].id.toString());
			}
		}
	}, [eligiblePrograms, selectedProgramId]);

	const handleStudentChange = useCallback((value: string | number) => {
		setStdNo(value);
		setSelectedProgramId('');
	}, []);

	const handleAddReceipt = useCallback(() => {
		if (newReceiptType && newReceiptNo.trim()) {
			setPaymentReceipts((prev) => [
				...prev,
				{
					receiptType: newReceiptType as ReceiptType,
					receiptNo: newReceiptNo.trim(),
				},
			]);
			setNewReceiptType('');
			setNewReceiptNo('');
		}
	}, [newReceiptType, newReceiptNo]);

	const handleRemoveReceipt = useCallback((index: number) => {
		setPaymentReceipts((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const programOptions = eligiblePrograms.map((program) => ({
		value: program.id.toString(),
		label: `${program.structure.program.name} (${program.structure.program.code}) - ${program.status}`,
	}));

	const graduationDateOptions = graduationDates.map(
		(date: GraduationDateOption) => ({
			value: date.id.toString(),
			label: `${date.date} (${date.term?.code ?? 'No term'})`,
		})
	);

	const handleFormSubmit = async (_values: Record<string, unknown>) => {
		if (!selectedProgramId) {
			throw new Error('Please select a program');
		}

		if (!selectedGraduationDateId) {
			throw new Error('Please select a graduation date');
		}

		const submissionData: SubmissionData = {
			studentProgramId: Number(selectedProgramId),
			graduationDateId: Number(selectedGraduationDateId),
			informationConfirmed: false,
			stdNo: Number(stdNo),
			paymentReceipts: paymentReceipts.length > 0 ? paymentReceipts : undefined,
		};

		return onSubmit(submissionData);
	};

	return (
		<Form
			title={title}
			action={
				handleFormSubmit as unknown as (
					values: Record<string, unknown>
				) => Promise<Record<string, unknown>>
			}
			queryKey={['graduation-requests']}
			schema={createInsertSchema(graduationRequests).omit({
				studentProgramId: true,
				graduationDateId: true,
			})}
			defaultValues={defaultValues}
			onSuccess={(values) => {
				const id = (values as unknown as SubmissionData).id;
				router.push(`/registry/graduation/requests/${id}`);
			}}
		>
			{(form) => {
				const handleFormReady = (f: MinimalForm) => {
					if (!formInstance) setFormInstance(f);
				};

				return (
					<Stack gap='md'>
						<FormBinder form={form} onReady={handleFormReady} />

						<Group w='100%' align='flex-start' wrap='nowrap'>
							<Box style={{ flex: 1 }}>
								<StdNoInput
									value={stdNo}
									onChange={handleStudentChange}
									disabled={!!initialStdNo}
								/>
							</Box>
							<ActionIcon
								component={Link}
								href={`/registry/students/${stdNo}`}
								target='_blank'
								mt={25}
								size='lg'
								variant='default'
								disabled={!stdNo}
							>
								<IconExternalLink size='1rem' />
							</ActionIcon>
						</Group>

						<Select
							label='Program'
							placeholder='Select program to graduate from'
							value={selectedProgramId}
							onChange={(value) => setSelectedProgramId(value || '')}
							data={programOptions}
							disabled={
								!stdNo || loadingPrograms || programOptions.length === 0
							}
							searchable
							required
							nothingFoundMessage={
								!stdNo
									? 'Enter student number first'
									: loadingPrograms
										? 'Loading programs...'
										: 'No eligible programs found'
							}
						/>

						<Select
							label='Graduation Date'
							placeholder='Select graduation date'
							value={selectedGraduationDateId}
							onChange={(value) => setSelectedGraduationDateId(value || '')}
							data={graduationDateOptions}
							disabled={loadingDates}
							searchable
							required
							nothingFoundMessage={
								loadingDates
									? 'Loading graduation dates...'
									: 'No graduation dates available'
							}
						/>

						<Paper withBorder p='md'>
							<Stack gap='sm'>
								<Text fw={500} size='sm'>
									Payment Receipts
								</Text>
								<Divider />

								<Group align='flex-end'>
									<Select
										label='Receipt Type'
										placeholder='Select type'
										data={RECEIPT_TYPE_OPTIONS}
										value={newReceiptType}
										onChange={(value) => setNewReceiptType(value || '')}
										style={{ flex: 1 }}
									/>
									<TextInput
										label='Receipt Number'
										placeholder='Enter receipt number'
										value={newReceiptNo}
										onChange={(e) => setNewReceiptNo(e.currentTarget.value)}
										style={{ flex: 1 }}
									/>
									<ActionIcon
										variant='filled'
										color='blue'
										size='lg'
										onClick={handleAddReceipt}
										disabled={!newReceiptType || !newReceiptNo.trim()}
									>
										<IconPlus size='1rem' />
									</ActionIcon>
								</Group>

								{paymentReceipts.length > 0 && (
									<Table striped highlightOnHover>
										<Table.Thead>
											<Table.Tr>
												<Table.Th>Type</Table.Th>
												<Table.Th>Receipt No</Table.Th>
												<Table.Th>Action</Table.Th>
											</Table.Tr>
										</Table.Thead>
										<Table.Tbody>
											{paymentReceipts.map((receipt, index) => (
												<Table.Tr key={`${receipt.receiptType}-${index}`}>
													<Table.Td>
														{RECEIPT_TYPE_OPTIONS.find(
															(o) => o.value === receipt.receiptType
														)?.label ?? receipt.receiptType}
													</Table.Td>
													<Table.Td>{receipt.receiptNo}</Table.Td>
													<Table.Td>
														<ActionIcon
															color='red'
															variant='subtle'
															onClick={() => handleRemoveReceipt(index)}
														>
															<IconTrash size='1rem' />
														</ActionIcon>
													</Table.Td>
												</Table.Tr>
											))}
										</Table.Tbody>
									</Table>
								)}

								{paymentReceipts.length === 0 && (
									<Text size='sm' c='dimmed' ta='center' py='sm'>
										No payment receipts added yet
									</Text>
								)}
							</Stack>
						</Paper>
					</Stack>
				);
			}}
		</Form>
	);
}
