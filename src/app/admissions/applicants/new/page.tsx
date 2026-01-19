import {
	Box,
	Paper,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
	Title,
} from '@mantine/core';
import { IconForms, IconUpload } from '@tabler/icons-react';
import DocumentUpload from '../_components/DocumentUpload';
import Form from '../_components/Form';
import { createApplicant } from '../_server/actions';

export default function NewPage() {
	return (
		<Box p='lg'>
			<Stack gap='lg'>
				<Title order={3}>New Applicant</Title>
				<Tabs defaultValue='upload'>
					<TabsList>
						<TabsTab value='upload' leftSection={<IconUpload size={16} />}>
							Upload Documents
						</TabsTab>
						<TabsTab value='form' leftSection={<IconForms size={16} />}>
							Fill Form
						</TabsTab>
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
							<Form onSubmit={createApplicant} />
						</Paper>
					</TabsPanel>
				</Tabs>
			</Stack>
		</Box>
	);
}
