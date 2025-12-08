import {
	Box,
	Grid,
	GridCol,
	Group,
	Paper,
	Skeleton,
	Stack,
} from '@mantine/core';

export default function SubmissionLoading() {
	return (
		<Box
			style={{
				height: '100vh',
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
			}}
		>
			{/* Header Skeleton */}
			<Group
				justify='space-between'
				px='md'
				py='sm'
				style={{
					borderBottom: '1px solid var(--mantine-color-default-border)',
				}}
			>
				<Group>
					<Skeleton height={36} width={36} radius='xl' />
					<Skeleton height={16} width={100} />
				</Group>
				<Group>
					<Skeleton height={36} width={36} radius='xl' />
					<Skeleton height={36} width={36} radius='xl' />
					<Skeleton height={36} width={36} radius='xl' />
				</Group>
				<Group>
					<Skeleton height={40} width={40} radius='xl' />
					<Stack gap={4}>
						<Skeleton height={16} width={120} />
						<Skeleton height={14} width={80} />
					</Stack>
					<Group>
						<Skeleton height={32} width={32} radius='xl' />
						<Skeleton height={32} width={32} radius='xl' />
					</Group>
				</Group>
			</Group>

			{/* Main Content */}
			<Box style={{ flex: 1, overflow: 'hidden' }}>
				<Grid gutter={0} h='100%'>
					{/* Files Sidebar */}
					<GridCol
						span={{ base: 12, md: 2 }}
						style={{
							borderRight: '1px solid var(--mantine-color-default-border)',
						}}
					>
						<Paper p='md' h='100%' radius={0}>
							<Stack gap='lg'>
								<Skeleton height={20} width='80%' />
								<Stack gap='sm'>
									<Skeleton height={40} width='100%' radius='sm' />
									<Skeleton height={40} width='100%' radius='sm' />
									<Skeleton height={40} width='100%' radius='sm' />
								</Stack>
							</Stack>
						</Paper>
					</GridCol>

					{/* File Preview */}
					<GridCol span={{ base: 12, md: 7 }}>
						<Box
							h='100%'
							style={{
								background: 'var(--mantine-color-dark-8)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Skeleton height={60} width={60} radius='xl' />
						</Box>
					</GridCol>

					{/* Grading Panel */}
					<GridCol
						span={{ base: 12, md: 3 }}
						style={{
							borderLeft: '1px solid var(--mantine-color-default-border)',
						}}
					>
						<Paper p='md' h='100%' radius={0}>
							<Stack gap='lg'>
								<Skeleton height={24} width='60%' />
								<Skeleton height={40} width='100%' radius='sm' />
								<Skeleton height={20} width='40%' />
								<Skeleton height={100} width='100%' radius='sm' />
								<Skeleton height={40} width='100%' radius='sm' />
							</Stack>
						</Paper>
					</GridCol>
				</Grid>
			</Box>
		</Box>
	);
}
