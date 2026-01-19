'use client';

import {
	Box,
	Button,
	CloseButton,
	Divider,
	Group,
	Paper,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
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
				<Title order={3}>New Applicant</Title>
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

					<TabsPanel value='upload' pt='md'>
						<Paper p='lg' withBorder radius='md'>
							<DocumentUpload />
						</Paper>
					</TabsPanel>

					<TabsPanel value='form' pt='md'>
						<Paper p='lg' withBorder radius='md'>
							<Text size='sm' c='dimmed' mb='md'>
								Manually enter applicant information
							</Text>
							<Form onSubmit={createApplicant} formRef={formRef} hideHeader />
						</Paper>
					</TabsPanel>
				</Tabs>
			</Stack>
		</Box>
	);
}
