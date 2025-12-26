'use client';

import { Button, Center, Loader, Modal, Tabs } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getStudent } from '../../../_server/actions';
import AcademicsView from '../../academics/AcademicsView';
import RegistrationRequestForm from './RegistrationRequestForm';
import StructureView from './StructureView';

type Props = {
	stdNo: number;
};

export default function RegistrationModal({ stdNo }: Props) {
	const [activeTab, setActiveTab] = useState<string | null>('registration');
	const [opened, { open, close }] = useDisclosure(false);

	const { data: student, isLoading } = useQuery({
		queryKey: ['student', stdNo],
		queryFn: () => getStudent(stdNo),
		enabled: opened,
	});

	return (
		<>
			<Button
				leftSection={<IconPlus size={14} />}
				variant='filled'
				size='sm'
				color='blue'
				onClick={open}
			>
				Create
			</Button>
			<Modal
				opened={opened}
				onClose={close}
				title='Student Registration'
				size='60vw'
				centered
				closeOnEscape
			>
				<Tabs value={activeTab} onChange={setActiveTab} variant='outline'>
					<Tabs.List>
						<Tabs.Tab value='registration'>Registration Request</Tabs.Tab>
						<Tabs.Tab value='academics'>Academic History</Tabs.Tab>
						<Tabs.Tab value='structure'>Program Structure</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value='registration' pt='md'>
						<RegistrationRequestForm stdNo={stdNo} />
					</Tabs.Panel>

					<Tabs.Panel value='academics' pt='md'>
						{isLoading ? (
							<Center mih='80vh'>
								<Loader size='sm' />
							</Center>
						) : student ? (
							<AcademicsView mih='80vh' student={student} showMarks />
						) : null}
					</Tabs.Panel>

					<Tabs.Panel value='structure' pt='md'>
						<StructureView stdNo={stdNo} isActive={activeTab === 'structure'} />
					</Tabs.Panel>
				</Tabs>
			</Modal>
		</>
	);
}
