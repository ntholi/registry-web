'use client';

import {
	Box,
	Button,
	CloseButton,
	Divider,
	Group,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Title,
} from '@mantine/core';
import { IconDeviceFloppy, IconForms, IconUpload } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import DocumentUpload from '../_components/DocumentUpload';
import Form from '../_components/Form';
import { createApplicant } from '../_server/actions';

export default function NewPage() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<string | null>('upload');
	const formRef = useRef<HTMLFormElement>(null);

	return (
		<Box p='lg'>
			<Stack gap='lg'>
				<Title order={4} fw={100}>
					New Applicant
				</Title>
				<Tabs value={activeTab} onChange={setActiveTab}>
					<TabsList>
						<TabsTab value='upload' leftSection={<IconUpload size={16} />}>
							Upload Documents
						</TabsTab>
						<TabsTab value='form' leftSection={<IconForms size={16} />}>
							Fill Form
						</TabsTab>
						{activeTab === 'form' && (
							<Group ml='auto' mb={'xs'}>
								<Button
									type='submit'
									size='xs'
									onClick={() => router.back()}
									leftSection={<IconDeviceFloppy size={'1rem'} />}
								>
									Save
								</Button>
								<Divider orientation='vertical' />
								<CloseButton size={'lg'} onClick={() => router.back()} />
							</Group>
						)}
					</TabsList>

					<TabsPanel value='upload' pt='xl' px={'md'}>
						<DocumentUpload />
					</TabsPanel>

					<TabsPanel value='form' pt='xl' px={'md'}>
						<Form onSubmit={createApplicant} formRef={formRef} hideHeader />
					</TabsPanel>
				</Tabs>
			</Stack>
		</Box>
	);
}
