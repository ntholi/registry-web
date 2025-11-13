'use client';

import { Center, Loader, Modal, Tabs } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import AcademicsView from '@/modules/registry/features/students/components/[id]/AcademicsView';
import { getStudent } from '@/modules/registry/features/students/server/actions';
import RegistrationRequestForm from './RegistrationRequestForm';
import StructureView from './StructureView';

type Props = {
	opened: boolean;
	onClose: () => void;
	stdNo: number;
};

export default function RegistrationModal({ opened, onClose, stdNo }: Props) {
	const [activeTab, setActiveTab] = useState<string | null>('registration');

	const { data: student, isLoading } = useQuery({
		queryKey: ['student', stdNo],
		queryFn: () => getStudent(stdNo),
		enabled: opened,
	});

	return (
		<Modal
			opened={opened}
			onClose={onClose}
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
	);
}
