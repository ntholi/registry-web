import { getModulesForStructure } from '@academic/semester-modules';
import { getSponsoredStudent } from '@finance/sponsors';
import { Box } from '@mantine/core';
import {
	getRegistrationRequest,
	updateRegistration,
} from '@registry/registration';
import { Form } from '@registry/registration/requests';
import { notFound } from 'next/navigation';
import type {
	modules,
	ReceiptType,
	StudentModuleStatus,
	semesterModules,
} from '@/core/database';

type Props = {
	params: Promise<{ id: string }>;
};

type Module = typeof modules.$inferSelect;
type SemesterModule = typeof semesterModules.$inferSelect & {
	semesterNumber?: string;
	semesterName?: string;
	module: Module;
};
interface SelectedModule extends SemesterModule {
	status: StudentModuleStatus;
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

export default async function RegistrationRequestEdit({ params }: Props) {
	const { id } = await params;
	const registrationRequest = await getRegistrationRequest(Number(id));
	if (!registrationRequest) {
		return notFound();
	}

	const sponsored = await getSponsoredStudent(
		registrationRequest.stdNo,
		registrationRequest.termId
	);

	const existingReceipts =
		registrationRequest.registrationRequestReceipts || [];
	const repeatModuleReceipts = existingReceipts
		.filter((r) => r.receipt?.receiptType === 'repeat_module')
		.map((r) => r.receipt?.receiptNo)
		.filter((r): r is string => !!r);
	const tuitionFeeReceipts = existingReceipts
		.filter((r) => r.receipt?.receiptType === 'tuition_fee')
		.map((r) => r.receipt?.receiptNo)
		.filter((r): r is string => !!r);

	let repeatReceiptIdx = 0;
	const selectedModules = registrationRequest.requestedModules.map((rm) => {
		const isRepeat = rm.moduleStatus.startsWith('Repeat');
		const receiptNumber = isRepeat
			? repeatModuleReceipts[repeatReceiptIdx++] || ''
			: undefined;
		return {
			...rm.semesterModule,
			status: rm.moduleStatus,
			receiptNumber,
		};
	}) as SelectedModule[];

	const structureModules = registrationRequest.structureId
		? await getModulesForStructure(registrationRequest.structureId)
		: undefined;

	async function handleSubmit(values: RegistrationRequest) {
		'use server';
		const { selectedModules, tuitionFeeReceipts: formTuitionReceipts } = values;
		if (!values.id) {
			throw new Error('Registration request ID is required');
		}

		const receipts: { receiptNo: string; receiptType: ReceiptType }[] = [];

		if (selectedModules) {
			for (const mod of selectedModules) {
				if (mod.status.startsWith('Repeat') && mod.receiptNumber) {
					receipts.push({
						receiptNo: mod.receiptNumber,
						receiptType: 'repeat_module',
					});
				}
			}
		}

		if (formTuitionReceipts) {
			for (const receiptNo of formTuitionReceipts.filter(Boolean)) {
				receipts.push({ receiptNo, receiptType: 'tuition_fee' });
			}
		}

		const res = await updateRegistration(
			values.id,
			selectedModules?.map((module) => ({
				id: module.id,
				status: module.status,
				receiptNumber: module.receiptNumber,
			})) || [],
			{
				sponsorId: values.sponsorId,
				borrowerNo: values.borrowerNo,
				bankName: values.bankName,
				accountNumber: values.accountNumber,
			},
			values.semesterNumber,
			values.semesterStatus,
			values.termId,
			receipts
		);
		return {
			...values,
			id: values.id,
			stdNo: res.request.stdNo,
			termId: res.request.termId,
			semesterNumber: res.request.semesterNumber,
			semesterStatus: res.request.semesterStatus,
		};
	}

	return (
		<Box p={'lg'}>
			<Form
				title={'Edit Registration Request'}
				defaultValues={{
					id: registrationRequest.id,
					stdNo: registrationRequest.stdNo,
					semesterStatus: registrationRequest.semesterStatus ?? 'Active',
					sponsorId:
						registrationRequest.sponsoredStudent?.sponsorId ||
						sponsored?.sponsor?.id ||
						0,
					borrowerNo:
						registrationRequest.sponsoredStudent?.borrowerNo ||
						sponsored?.borrowerNo ||
						'',
					bankName:
						registrationRequest.sponsoredStudent?.bankName ||
						sponsored?.bankName ||
						'',
					accountNumber:
						registrationRequest.sponsoredStudent?.accountNumber ||
						sponsored?.accountNumber ||
						'',
					semesterNumber: registrationRequest.semesterNumber,
					termId: registrationRequest.termId,
					selectedModules,
					tuitionFeeReceipts,
				}}
				onSubmit={handleSubmit}
				structureModules={structureModules}
				structureId={registrationRequest?.structureId || undefined}
			/>
		</Box>
	);
}
