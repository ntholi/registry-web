import { getModulesForStructure } from '@academic/semester-modules';
import { getStudentCurrentSponsorship } from '@finance/sponsors';
import { Box } from '@mantine/core';
import { getActiveTerm } from '@registry/dates/terms';
import {
	createRegistration,
	determineSemesterStatus,
	Form,
	getStudentSemesterModules,
} from '@registry/registration/requests';
import { getStudent, getStudentRegistrationData } from '@registry/students';
import type {
	modules,
	StudentModuleStatus,
	semesterModules,
} from '@/core/database';
import { getAcademicRemarks } from '@/shared/lib/utils/grades';

type Props = {
	searchParams: Promise<{ stdNo?: string }>;
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

export default async function NewRegistrationRequestPage({
	searchParams,
}: Props) {
	const { stdNo: stdNoParam } = await searchParams;
	const activeTerm = await getActiveTerm();

	let defaultValues: Partial<RegistrationRequest> = {
		termId: activeTerm.id,
	};
	let structureModules:
		| Awaited<ReturnType<typeof getModulesForStructure>>
		| undefined;
	let structureId: number | undefined;
	let initialStdNo: number | undefined;

	if (stdNoParam) {
		const stdNo = Number(stdNoParam);
		const student = await getStudent(stdNo);

		if (student) {
			initialStdNo = stdNo;
			const studentData = await getStudentRegistrationData(stdNo);

			if (studentData) {
				const activeProgram = studentData.programs.find(
					(p) => p.status === 'Active'
				);

				if (activeProgram) {
					structureId = activeProgram.structureId;
					structureModules = await getModulesForStructure(structureId);

					const remarks = getAcademicRemarks(studentData.programs);
					const moduleDataResponse = await getStudentSemesterModules(
						studentData,
						remarks
					);

					if (
						!moduleDataResponse.error &&
						moduleDataResponse.modules.length > 0
					) {
						const semesterResult = await determineSemesterStatus(
							moduleDataResponse.modules as Parameters<
								typeof determineSemesterStatus
							>[0],
							studentData
						);

						const mappedModules = moduleDataResponse.modules.map(
							(moduleData) =>
								({
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
								}) as unknown as SelectedModule
						);

						defaultValues = {
							...defaultValues,
							stdNo,
							semesterNumber: semesterResult.semesterNo.toString(),
							semesterStatus: semesterResult.status,
							selectedModules: mappedModules,
						};
					}

					const sponsorship = await getStudentCurrentSponsorship(stdNo);
					if (sponsorship) {
						defaultValues = {
							...defaultValues,
							sponsorId: sponsorship.sponsorId,
							borrowerNo: sponsorship.borrowerNo ?? undefined,
							bankName: sponsorship.bankName ?? undefined,
							accountNumber: sponsorship.accountNumber ?? undefined,
						};
					}
				}
			}
		}
	}

	async function handleSubmit(values: RegistrationRequest) {
		'use server';
		const { selectedModules } = values;

		const result = await createRegistration({
			stdNo: values.stdNo,
			modules:
				selectedModules?.map((module) => ({
					moduleId: module.id,
					moduleStatus: module.status,
				})) || [],
			sponsorId: values.sponsorId,
			semesterNumber: values.semesterNumber,
			semesterStatus: values.semesterStatus,
			termId: values.termId,
			borrowerNo: values.borrowerNo,
			bankName: values.bankName,
			accountNumber: values.accountNumber,
		});

		return {
			...values,
			id: result.request.id,
			stdNo: result.request.stdNo,
			termId: result.request.termId,
			semesterNumber: result.request.semesterNumber,
			semesterStatus: result.request.semesterStatus,
		};
	}

	return (
		<Box p='lg'>
			<Form
				title='New Registration Request'
				defaultValues={defaultValues as RegistrationRequest}
				onSubmit={handleSubmit}
				structureModules={structureModules}
				structureId={structureId}
				initialStdNo={initialStdNo}
			/>
		</Box>
	);
}
