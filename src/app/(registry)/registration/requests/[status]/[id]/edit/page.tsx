import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import type {
	modules,
	StudentModuleStatus,
	semesterModules,
} from '@/db/schema';
import { getModulesForStructure } from '@/server/academic/semester-modules/actions';
import { getSponsoredStudent } from '@/server/finance/sponsors/actions';
import {
	getRegistrationRequest,
	updateRegistrationWithModulesAndSponsorship,
} from '@/server/registry/registration/requests/actions';
import EditForm from '../../../Form';

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

	const selectedModules = registrationRequest.requestedModules.map((rm) => ({
		...rm.semesterModule,
		status: rm.moduleStatus,
	})) as SelectedModule[];

	const structureModules = registrationRequest.structureId
		? await getModulesForStructure(registrationRequest.structureId)
		: undefined;

	async function handleSubmit(values: RegistrationRequest) {
		'use server';
		const { selectedModules } = values;
		if (!values.id) {
			throw new Error('Registration request ID is required');
		}
		const res = await updateRegistrationWithModulesAndSponsorship(
			values.id,
			selectedModules?.map((module) => ({
				id: module.id,
				status: module.status,
			})) || [],
			{
				sponsorId: values.sponsorId,
				borrowerNo: values.borrowerNo,
				bankName: values.bankName,
				accountNumber: values.accountNumber,
			},
			values.semesterNumber,
			values.semesterStatus,
			values.termId
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
			<EditForm
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
				}}
				onSubmit={handleSubmit}
				structureModules={structureModules}
				structureId={registrationRequest?.structureId || undefined}
			/>
		</Box>
	);
}
