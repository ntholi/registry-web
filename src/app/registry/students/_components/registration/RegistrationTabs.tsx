'use client';

import {
	Badge,
	Button,
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
import { IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';
import { getStudentRegistrationData } from '../../_server/actions';
import ProofOfRegistrationPrinter from './proof/ProofOfRegistrationPrinter';
import RequestsView from './RequestsView';
import SemestersView from './SemestersView';

type Props = {
	stdNo: number;
	isActive?: boolean;
};

export default function RegistrationTabs({ stdNo, isActive = true }: Props) {
	const [activeTab, setActiveTab] = useState<string | null>('requests');
	const { activeTerm } = useActiveTerm();
	const { data: session } = useSession();

	const { data: studentData, isLoading } = useQuery({
		queryKey: ['student-registration-data', stdNo],
		queryFn: () => getStudentRegistrationData(stdNo),
		enabled: isActive,
	});

	const activeProgram = studentData?.programs?.find(
		(p) => p.status === 'Active'
	);
	const hasActiveTermRegistration = activeProgram?.semesters?.some(
		(semester) =>
			semester.termCode === activeTerm?.code && semester.status === 'Active'
	);

	const pendingRegistrationRequest = studentData?.registrationRequests?.find(
		(request) =>
			request.term?.code === activeTerm?.code && request.status === 'pending'
	);

	return (
		<Stack>
			{isLoading ? (
				<Card withBorder p='md'>
					<Group justify='space-between' align='center'>
						<Stack gap={4}>
							<Skeleton height={16} width={60} />
							<Skeleton height={12} width={200} />
						</Stack>
						<Skeleton height={36} width={120} />
					</Group>
				</Card>
			) : (
				activeTerm && (
					<Card withBorder p='md'>
						<Group justify='space-between' align='center'>
							<Stack gap={4}>
								<Group gap='xs'>
									<Text size='sm' fw={500}>
										{activeTerm.code}
									</Text>
									{hasActiveTermRegistration && (
										<Badge size='xs' variant='light' color='green'>
											Registered
										</Badge>
									)}
									{pendingRegistrationRequest && (
										<Badge size='xs' variant='light' color='yellow'>
											Pending
										</Badge>
									)}
								</Group>
								<Text size='xs' c='dimmed'>
									{hasActiveTermRegistration
										? 'Student is registered for the current term'
										: pendingRegistrationRequest
											? 'Student has a pending registration request'
											: 'Create a registration request for this student'}
								</Text>
							</Stack>
							{hasActiveTermRegistration ? (
								<ProofOfRegistrationPrinter stdNo={stdNo} />
							) : (
								!pendingRegistrationRequest &&
								['registry', 'admin'].includes(session?.user?.role ?? '') && (
									<Button
										component={Link}
										href={`/registry/registration/requests/new?stdNo=${stdNo}`}
										leftSection={<IconPlus size={14} />}
										variant='filled'
										size='sm'
										color='blue'
									>
										Create
									</Button>
								)
							)}
						</Group>
					</Card>
				)
			)}

			<Tabs value={activeTab} onChange={setActiveTab} variant='default'>
				<TabsList>
					<TabsTab value='requests'>Requests</TabsTab>
					<TabsTab value='semesters'>Semesters</TabsTab>
				</TabsList>
				<TabsPanel value='requests' pt='xl'>
					<RequestsView
						stdNo={stdNo}
						isActive={isActive && activeTab === 'requests'}
					/>
				</TabsPanel>
				<TabsPanel value='semesters' pt='xl'>
					<SemestersView
						stdNo={stdNo}
						isActive={isActive && activeTab === 'semesters'}
					/>
				</TabsPanel>
			</Tabs>
		</Stack>
	);
}
