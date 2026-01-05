'use client';

import { getSponsor } from '@finance/sponsors';
import {
	Card,
	Group,
	Skeleton,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getStudentRegistrationData } from '../../_server/actions';
import NewSponsorModal from './NewSponsorModal';
import SemesterSponsorsView from './SemesterSponsorsView';
import StudentSponsorsView from './StudentSponsorsView';

type Props = {
	stdNo: number;
	isActive?: boolean;
};

export default function SponsorsView({ stdNo, isActive = true }: Props) {
	const [activeTab, setActiveTab] = useState<string | null>('semesters');

	const { data: registrationData, isLoading: isLoadingReg } = useQuery({
		queryKey: ['student-registration-data', stdNo],
		queryFn: () => getStudentRegistrationData(stdNo),
		enabled: isActive,
	});

	const latestSemester = getLatestSemester(registrationData);

	const { data: sponsor, isLoading: isLoadingSponsor } = useQuery({
		queryKey: ['sponsor', latestSemester?.sponsorId],
		queryFn: () =>
			latestSemester?.sponsorId ? getSponsor(latestSemester.sponsorId) : null,
		enabled: !!latestSemester?.sponsorId,
	});

	const isLoading =
		isLoadingReg || (latestSemester?.sponsorId && isLoadingSponsor);

	return (
		<Stack>
			<Card withBorder p='md'>
				<Group justify='space-between' align='center'>
					<Stack gap={4}>
						<Group gap='xs'>
							{isLoading ? (
								<Skeleton height={20} width={100} />
							) : sponsor ? (
								<Text fw={500} size='sm'>
									{sponsor.name}
								</Text>
							) : (
								<Text size='xs' c='dimmed' fs='italic'>
									(No sponsor)
								</Text>
							)}
						</Group>
						<Text size='xs' c='dimmed'>
							Manage student sponsorships and view sponsorship history
						</Text>
					</Stack>
					<NewSponsorModal stdNo={stdNo} />
				</Group>
			</Card>

			<Tabs value={activeTab} onChange={setActiveTab} variant='default'>
				<TabsList>
					<TabsTab value='semesters'>Semesters</TabsTab>
					<TabsTab value='sponsors'>Sponsors</TabsTab>
				</TabsList>
				<TabsPanel value='semesters' pt='xl'>
					<SemesterSponsorsView
						stdNo={stdNo}
						isActive={isActive && activeTab === 'semesters'}
					/>
				</TabsPanel>
				<TabsPanel value='sponsors' pt='xl'>
					<StudentSponsorsView
						stdNo={stdNo}
						isActive={isActive && activeTab === 'sponsors'}
					/>
				</TabsPanel>
			</Tabs>
		</Stack>
	);
}

type StudentData = Awaited<ReturnType<typeof getStudentRegistrationData>>;

function getLatestSemester(data: StudentData | undefined) {
	if (!data?.programs) return null;

	const activeProgram = data.programs.find((p) => p.status === 'Active');
	const semesters = activeProgram?.semesters || [];

	if (semesters.length === 0) return null;

	return (
		semesters
			.filter((s) => s.status === 'Active')
			.sort((a, b) => b.termCode.localeCompare(a.termCode))[0] || null
	);
}
