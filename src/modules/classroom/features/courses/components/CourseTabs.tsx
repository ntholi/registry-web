'use client';

import {
	AssessmentsTabWrapper,
	DashboardTabWrapper,
	MaterialTabWrapper,
} from '@classroom/courses';
import {
	Box,
	Button,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
} from '@mantine/core';
import {
	IconBook2,
	IconChalkboard,
	IconClipboardCheck,
	IconPlus,
} from '@tabler/icons-react';
import { useLocalStorage } from '@/shared/lib/hooks/use-local-storage';
import CreateAnnouncementButton from './CreateAnnouncementButton';

type Props = {
	courseId: string;
};

export default function CourseTabs({ courseId }: Props) {
	const [activeTab, setActiveTab] = useLocalStorage<string | null>(
		'courseDetailsTab',
		'dashboard'
	);

	return (
		<Tabs
			value={activeTab}
			onChange={setActiveTab}
			variant='default'
			keepMounted={false}
		>
			<TabsList style={{ borderBottom: 'none' }}>
				<TabsTab
					value='dashboard'
					leftSection={<IconChalkboard size={16} />}
					pb='md'
					px='lg'
					fw={500}
				>
					Dashboard
				</TabsTab>
				<TabsTab
					value='assessments'
					leftSection={<IconClipboardCheck size={16} />}
					pb='md'
					px='lg'
					fw={500}
				>
					Assessments
				</TabsTab>
				<TabsTab
					value='material'
					leftSection={<IconBook2 size={16} />}
					pb='md'
					px='lg'
					fw={500}
				>
					Material
				</TabsTab>

				{activeTab === 'dashboard' && (
					<Box ml='auto'>
						<CreateAnnouncementButton courseId={courseId} />
					</Box>
				)}
				{activeTab === 'assessments' && (
					<Box ml='auto'>
						<Button size='xs' leftSection={<IconPlus size={14} />}>
							Create Assessment
						</Button>
					</Box>
				)}
				{activeTab === 'material' && (
					<Box ml='auto'>
						<Button size='xs' leftSection={<IconPlus size={14} />}>
							Create Material
						</Button>
					</Box>
				)}
			</TabsList>

			<Box py='xl'>
				<TabsPanel value='dashboard'>
					<DashboardTabWrapper courseId={courseId} />
				</TabsPanel>

				<TabsPanel value='assessments'>
					<AssessmentsTabWrapper courseId={courseId} />
				</TabsPanel>

				<TabsPanel value='material'>
					<MaterialTabWrapper courseId={courseId} />
				</TabsPanel>
			</Box>
		</Tabs>
	);
}
