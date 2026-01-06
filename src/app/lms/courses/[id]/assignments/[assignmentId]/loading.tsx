import {
	Box,
	Button,
	Container,
	Divider,
	Flex,
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
	IconClipboardList,
	IconEdit,
	IconExternalLink,
	IconFileDescription,
	IconRuler2,
	IconUsers,
} from '@tabler/icons-react';

export default function AssignmentLoading() {
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
					<Flex align='start' gap='md' justify='space-between'>
						<Flex align='center' gap='md'>
							<ThemeIcon size={60} variant='light' color='gray'>
								<IconClipboardList size='1.5rem' />
							</ThemeIcon>
							<Stack gap={1}>
								<Group gap='xs'>
									<Skeleton height={22} width={120} radius='xs' />
									<Skeleton height={22} width={100} radius='xs' />
								</Group>
								<Skeleton height={28} width={350} mt={4} />
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

			<Tabs defaultValue='details' variant='outline' mt='xl'>
				<TabsList>
					<TabsTab
						value='details'
						leftSection={<IconFileDescription size={16} />}
					>
						Details
					</TabsTab>
					<TabsTab value='rubric' leftSection={<IconRuler2 size={16} />}>
						Rubric
					</TabsTab>
					<TabsTab value='submissions' leftSection={<IconUsers size={16} />}>
						Submissions
					</TabsTab>
					<Box ml='auto' mt={-5}>
						<Button
							variant='light'
							leftSection={<IconEdit size={16} />}
							size='xs'
							disabled
						>
							Edit
						</Button>
					</Box>
				</TabsList>

				<TabsPanel value='details' pt='lg'>
					<Grid gutter='lg'>
						<GridCol span={{ base: 12, md: 8 }}>
							<Paper p='lg' withBorder>
								<Stack gap='md'>
									<Group gap='xs'>
										<ThemeIcon size='sm' variant='light' color='gray'>
											<IconFileDescription size={14} />
										</ThemeIcon>
										<Title order={5}>Description</Title>
									</Group>
									<Divider />
									<Stack gap='xs'>
										<Skeleton height={16} width='100%' />
										<Skeleton height={16} width='95%' />
										<Skeleton height={16} width='98%' />
										<Skeleton height={16} width='90%' />
										<Skeleton height={16} width='85%' />
									</Stack>
								</Stack>
							</Paper>
						</GridCol>

						<GridCol span={{ base: 12, md: 4 }}>
							<Stack gap='md'>
								<Paper p='lg' withBorder>
									<Stack gap='md'>
										<Group gap='xs'>
											<Skeleton height={20} circle />
											<Skeleton height={18} width={80} />
										</Group>
										<Divider />
										<Stack gap='sm'>
											<Box>
												<Skeleton height={14} width={60} mb={8} />
												<Skeleton height={16} width='100%' />
											</Box>
											<Box>
												<Skeleton height={14} width={70} mb={8} />
												<Skeleton height={16} width='100%' />
											</Box>
											<Box>
												<Skeleton height={14} width={80} mb={8} />
												<Skeleton height={16} width='100%' />
											</Box>
										</Stack>
									</Stack>
								</Paper>

								<Paper p='lg' withBorder>
									<Stack gap='md'>
										<Group gap='xs'>
											<Skeleton height={20} circle />
											<Skeleton height={18} width={70} />
										</Group>
										<Divider />
										<Box>
											<Skeleton height={14} width={100} mb={8} />
											<Skeleton height={28} width={50} />
										</Box>
									</Stack>
								</Paper>
							</Stack>
						</GridCol>
					</Grid>
				</TabsPanel>
			</Tabs>
		</Container>
	);
}
