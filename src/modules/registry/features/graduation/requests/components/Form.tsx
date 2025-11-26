'use client';

import { Select, Stack, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { graduationRequests } from '@/modules/registry/database';
import { Form } from '@/shared/ui/adease';
import { getEligiblePrograms } from '../../clearance/server/requests/actions';

type GraduationRequest = typeof graduationRequests.$inferInsert;

type Props = {
	onSubmit: (values: GraduationRequest) => Promise<GraduationRequest>;
	defaultValues?: GraduationRequest;
	onSuccess?: (value: GraduationRequest) => void;
	onError?: (
		error: Error | React.SyntheticEvent<HTMLDivElement, Event>
	) => void;
	title?: string;
};

export default function GraduationRequestForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();
	const [studentNo, setStudentNo] = useState<string>('');
	const [selectedProgramId, setSelectedProgramId] = useState<string>('');

	const { data: eligiblePrograms, isLoading: loadingPrograms } = useQuery({
		queryKey: ['eligible-programs-admin', studentNo],
		queryFn: async () => {
			if (!studentNo || Number.isNaN(Number(studentNo))) return [];
			return await getEligiblePrograms(Number(studentNo));
		},
		enabled: !!studentNo && !Number.isNaN(Number(studentNo)),
	});

	const programOptions =
		eligiblePrograms?.map((program) => ({
			value: program.id.toString(),
			label: `${program.structure.program.name} (${program.structure.program.code}) - ${program.status}`,
		})) || [];

	useEffect(() => {
		if (defaultValues?.studentProgramId) {
			setSelectedProgramId(defaultValues.studentProgramId.toString());
		}
	}, [defaultValues]);

	const handleFormSubmit = async (values: Record<string, unknown>) => {
		if (!selectedProgramId) {
			throw new Error('Please select a program');
		}

		const submissionData: GraduationRequest = {
			...values,
			studentProgramId: Number(selectedProgramId),
		};
		return onSubmit(submissionData);
	};

	return (
		<Form
			title={title}
			action={handleFormSubmit}
			queryKey={['graduation-clearances']}
			schema={createInsertSchema(graduationRequests).omit({
				studentProgramId: true,
			})}
			defaultValues={defaultValues}
			onSuccess={() => {
				router.push(`/registry/graduation/requests/pending`);
			}}
		>
			{() => (
				<Stack gap='md'>
					<TextInput
						label='Student Number'
						value={studentNo}
						onChange={(e) => setStudentNo(e.target.value)}
						placeholder='Enter student number'
					/>

					<Select
						label='Select Program'
						placeholder='Choose program to graduate from'
						value={selectedProgramId}
						onChange={(value) => setSelectedProgramId(value || '')}
						data={programOptions}
						disabled={
							!studentNo || loadingPrograms || programOptions.length === 0
						}
						searchable
						nothingFoundMessage={
							!studentNo
								? 'Enter student number first'
								: loadingPrograms
									? 'Loading programs...'
									: 'No eligible programs found'
						}
					/>
				</Stack>
			)}
		</Form>
	);
}
