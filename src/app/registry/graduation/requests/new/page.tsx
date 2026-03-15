import type { ReceiptType } from '@finance/_database';
import { Box } from '@mantine/core';
import {
	createGraduationRequest,
	createGraduationRequestWithPaymentReceipts,
} from '@registry/graduation/clearance';
import { getLatestGraduationDate } from '@registry/graduation/dates';
import { getStudent, getStudentRegistrationData } from '@registry/students';
import type { graduationRequests } from '@/core/database';
import { unwrap } from '@/shared/lib/utils/actionResult';
import GraduationRequestForm from '../_components/GraduationRequestForm';

type Props = {
	searchParams: Promise<{ stdNo?: string }>;
};

type GraduationRequest = typeof graduationRequests.$inferInsert;

interface PaymentReceiptInput {
	receiptType: ReceiptType;
	receiptNo: string;
}

interface SubmissionData extends GraduationRequest {
	stdNo?: number;
	paymentReceipts?: PaymentReceiptInput[];
}

interface FormValues {
	studentProgramId?: number;
	graduationDateId?: number;
}

export default async function NewGraduationRequestPage({
	searchParams,
}: Props) {
	const { stdNo: stdNoParam } = await searchParams;
	const latestGraduationDate = unwrap(await getLatestGraduationDate());

	let defaultValues: Partial<FormValues> = {
		graduationDateId: latestGraduationDate?.id ?? undefined,
	};
	let initialStdNo: number | undefined;
	const initialGraduationDateId: number | undefined = latestGraduationDate?.id;

	if (stdNoParam) {
		const stdNo = Number(stdNoParam);
		const student = unwrap(await getStudent(stdNo));

		if (student) {
			initialStdNo = stdNo;
			const studentData = unwrap(await getStudentRegistrationData(stdNo));

			if (studentData) {
				const completedProgram = studentData.programs.find(
					(p) => p.status === 'Completed'
				);
				const activeProgram = studentData.programs.find(
					(p) => p.status === 'Active'
				);
				const targetProgram = completedProgram || activeProgram;

				if (targetProgram) {
					defaultValues = {
						...defaultValues,
						studentProgramId: targetProgram.id,
					};
				}
			}
		}
	}

	async function handleSubmit(values: SubmissionData) {
		'use server';
		const { paymentReceipts, stdNo, ...graduationRequestData } = values;

		if (paymentReceipts && paymentReceipts.length > 0 && stdNo) {
			const result = unwrap(
				await createGraduationRequestWithPaymentReceipts({
					...graduationRequestData,
					paymentReceipts,
					stdNo,
				})
			);
			return {
				...values,
				id: result.id,
			};
		}

		const result = unwrap(
			await createGraduationRequest(graduationRequestData)
		);
		return {
			...values,
			id: result.id,
		};
	}

	return (
		<Box p='lg'>
			<GraduationRequestForm
				title='New Graduation Request'
				defaultValues={defaultValues}
				onSubmit={handleSubmit}
				initialStdNo={initialStdNo}
				initialGraduationDateId={initialGraduationDateId}
			/>
		</Box>
	);
}
