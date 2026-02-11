import {
	Box,
	Button,
	Container,
	Divider,
	Grid,
	GridCol,
	Group,
	Paper,
	Skeleton,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	ThemeIcon,
	Title,
} from '@mantine/core';
import {
	IconArrowNarrowLeft,
	IconEdit,
	IconFileDescription,
	IconPaperclip,
	IconSettings,
} from '@tabler/icons-react';

export default function AssignmentEditLoading() {
	return (
		<Container size='xl'>
			<Stack>
				<Group align='center'>
					<ThemeIcon radius='xl' variant='light' color='gray'>
						<IconArrowNarrowLeft size='1.2rem' />
					</ThemeIcon>
					<Skeleton height={16} width={150} />
				</Group>

				<Paper p='xl' withBorder>
					<Group align='center' gap='md'>
						<ThemeIcon size={60} variant='default'>
							<IconEdit size='1.5rem' />
						</ThemeIcon>
						<Stack gap={1}>
							<Group gap='xs'>
								<Skeleton height={22} width={120} radius='xs' />
								<Skeleton height={22} width={60} radius='xs' />
							</Group>
							<Skeleton height={28} width={300} mt={4} />
						</Stack>
					</Group>
				</Paper>
			</Stack>

			<Tabs defaultValue='general' variant='outline' mt='xl'>
				<TabsList>
					<TabsTab
						value='general'
						leftSection={<IconFileDescription size={16} />}
					>
						General
					</TabsTab>
					<TabsTab value='settings' leftSection={<IconSettings size={16} />}>
						Settings
					</TabsTab>

					<Box ml='auto' mt={-5}>
						<Group gap='xs'>
							<Button variant='default' size='xs' disabled>
								Cancel
							</Button>
							<Button size='xs' disabled>
								Save Changes
							</Button>
						</Group>
					</Box>
				</TabsList>

				<TabsPanel value='general' pt='lg'>
					<Stack gap='lg'>
						<Grid gutter='lg'>
							<GridCol span={{ base: 12, md: 6 }}>
								<Paper p='lg' withBorder h='100%'>
									<Stack gap='md'>
										<Title order={5}>Assignment Information</Title>
										<Divider />
										<Stack gap='sm'>
											<Skeleton height={14} width={110} />
											<Skeleton height={36} width='100%' />
										</Stack>
										<Stack gap='sm'>
											<Skeleton height={14} width={50} />
											<Skeleton height={36} width='100%' />
										</Stack>
										<Stack gap='sm'>
											<Skeleton height={14} width={70} />
											<Skeleton height={36} width='100%' />
										</Stack>
									</Stack>
								</Paper>
							</GridCol>

							<GridCol span={{ base: 12, md: 6 }}>
								<Paper p='lg' withBorder h='100%'>
									<Stack gap='md'>
										<Group gap='xs' justify='space-between'>
											<Group gap='xs'>
												<ThemeIcon size='sm' variant='light' color='gray'>
													<IconPaperclip size={14} />
												</ThemeIcon>
												<Title order={5}>Files</Title>
											</Group>
											<Skeleton height={28} width={80} radius='sm' />
										</Group>
										<Divider />
										<Skeleton height={16} width={120} mx='auto' />
									</Stack>
								</Paper>
							</GridCol>
						</Grid>

						<Stack gap='xs'>
							<Group gap='xs'>
								<Skeleton height={36} width={100} />
								<Skeleton height={36} width={100} />
							</Group>
							<Skeleton height={320} width='100%' />
						</Stack>
					</Stack>
				</TabsPanel>
			</Tabs>
		</Container>
	);
}
