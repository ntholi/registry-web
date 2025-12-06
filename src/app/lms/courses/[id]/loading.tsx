import {
	Box,
	Button,
	Container,
	Flex,
	Group,
	Paper,
	Skeleton,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconArrowNarrowLeft,
	IconBook2,
	IconExternalLink,
} from '@tabler/icons-react';

export default function CourseLoading() {
	return (
		<Container size='xl'>
			<Stack>
				<Group align='center'>
					<ThemeIcon radius='xl' variant='light' color='gray'>
						<IconArrowNarrowLeft size='1.2rem' />
					</ThemeIcon>
					<Text size='sm' c='gray'>
						Back to Courses
					</Text>
				</Group>

				<Paper p='xl' withBorder>
					<Flex align='start' gap='md' justify='space-between'>
						<Flex align='center' gap='md'>
							<ThemeIcon size={60} variant='light' color='gray'>
								<IconBook2 size='1.5rem' />
							</ThemeIcon>
							<Stack gap={1}>
								<Group gap='xs'>
									<Skeleton height={22} width={100} radius='xs' />
									<Skeleton height={22} width={120} radius='xs' />
								</Group>
								<Skeleton height={28} width={300} mt={4} />
							</Stack>
						</Flex>
						<Button
							variant='default'
							size='xs'
							rightSection={<IconExternalLink size={16} />}
							disabled
						>
							Open in Moodle
						</Button>
					</Flex>
				</Paper>
			</Stack>

			<Tabs defaultValue='dashboard' variant='outline' mt='xl'>
				<TabsList>
					<TabsTab value='dashboard'>Dashboard</TabsTab>
					<TabsTab value='posts'>Posts</TabsTab>
					<TabsTab value='assessments'>Assessments</TabsTab>
					<TabsTab value='material'>Material</TabsTab>
					<TabsTab value='outline'>Outline</TabsTab>
					<TabsTab value='students'>Students</TabsTab>
					<TabsTab value='gradebook'>Gradebook</TabsTab>
					<TabsTab value='virtual-classroom'>Virtual Classroom</TabsTab>
				</TabsList>

				<TabsPanel value='dashboard' pt='lg'>
					<Box p='sm'>
						<Skeleton height={20} width='80%' mb='sm' />
						<Skeleton height={20} width='60%' />
					</Box>
				</TabsPanel>
			</Tabs>
		</Container>
	);
}
