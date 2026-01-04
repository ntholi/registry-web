'use client';

import {
	Badge,
	Button,
	Card,
	Group,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import NewSponsorModal from './NewSponsorModal';
import SemesterSponsorsView from './SemesterSponsorsView';
import StudentSponsorsView from './StudentSponsorsView';

type Props = {
	stdNo: number;
	isActive?: boolean;
};

export default function SponsorsView({ stdNo, isActive = true }: Props) {
	const [activeTab, setActiveTab] = useState<string | null>('semesters');
	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<Stack>
			<Card withBorder p='md'>
				<Group justify='space-between' align='center'>
					<Stack gap={4}>
						<Group gap='xs'>
							<Text size='sm' fw={500}>
								Current Sponsor
							</Text>
						</Group>
						<Text size='xs' c='dimmed'>
							Manage student sponsorships and view sponsorship history
						</Text>
					</Stack>
					<Button
						leftSection={<IconPlus size={14} />}
						variant='filled'
						size='sm'
						color='blue'
						onClick={() => setIsModalOpen(true)}
					>
						New Sponsor
					</Button>
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

			<NewSponsorModal
				stdNo={stdNo}
				opened={isModalOpen}
				onClose={() => setIsModalOpen(false)}
			/>
		</Stack>
	);
}
