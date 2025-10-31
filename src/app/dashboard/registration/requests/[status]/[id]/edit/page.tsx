import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import type { modules, StudentModuleStatus, semesterModules } from '@/db/schema';
import {
	getRegistrationRequest,
	updateRegistrationWithModulesAndSponsorship,
} from '@/server/registration/requests/actions';
import { getModulesForStructure } from '@/server/semester-modules/actions';
import { getSponsoredStudent } from '@/server/sponsors/actions';
import EditForm from '../../../Form';

type Props = {
	params: Promise<{ id: string }>;
};

type Module = typeof modules.$inferSelect;
type SemesterModule = typeof semesterModules.$inferSelect & {
	semesterNumber?: number;
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
	semesterNumber: number;
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
		return { ...res.request, id: values.id };
	}

	return (
		<Box p={'lg'}>
			<EditForm
				title={'Edit Registration Request'}
				defaultValues={{
					id: registrationRequest.id,
					stdNo: registrationRequest.stdNo,
					semesterStatus: registrationRequest.semesterStatus ?? 'Active',
					sponsorId: sponsored?.sponsor?.id || registrationRequest.sponsorId,
					borrowerNo: sponsored?.borrowerNo || '',
					bankName: sponsored?.bankName || '',
					accountNumber: sponsored?.accountNumber || '',
					semesterNumber: registrationRequest.semesterNumber ?? 1,
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
