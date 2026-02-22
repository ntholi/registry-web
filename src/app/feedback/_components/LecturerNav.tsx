'use client';

import {
	ActionIcon,
	Avatar,
	Box,
	Group,
	Indicator,
	Popover,
	Progress,
	Stack,
	Text,
	Tooltip,
	UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCheck, IconUsers } from '@tabler/icons-react';

type Lecturer = {
	assignedModuleId: number;
	lecturerName: string | null;
	lecturerImage: string | null;
	moduleCode: string;
	moduleName: string;
};

type Question = {
	questionId: string;
};

type ResponseEntry = {
	rating: number | null;
	comment: string | null;
};

type Props = {
	lecturers: Lecturer[];
	currentIndex: number;
	questions: Question[];
	getResponse: (
		assignedModuleId: number,
		questionId: string
	) => ResponseEntry | undefined;
	onNavigate: (index: number) => void;
};

export default function LecturerNav({
	lecturers,
	currentIndex,
	questions,
	getResponse,
	onNavigate,
}: Props) {
	const [opened, { toggle, close }] = useDisclosure(false);

	function answeredCount(lec: Lecturer) {
		return questions.filter((q) =>
			getResponse(lec.assignedModuleId, q.questionId)
		).length;
	}

	const completedCount = lecturers.filter(
		(lec) => answeredCount(lec) === questions.length
	).length;

	return (
		<Box
			style={{
				position: 'fixed',
				bottom: 24,
				right: 24,
				zIndex: 100,
			}}
		>
			<Popover
				opened={opened}
				onClose={close}
				position='top-end'
				width={340}
				shadow='xl'
				radius='md'
			>
				<Popover.Target>
					<Tooltip
						label={`All Lecturers · ${completedCount}/${lecturers.length} done`}
						position='right'
						disabled={opened}
					>
						<Indicator
							label={`${currentIndex + 1}/${lecturers.length}`}
							size={18}
							offset={4}
							color='dark'
							position='top-end'
						>
							<ActionIcon
								variant='filled'
								size={56}
								radius='xl'
								onClick={toggle}
								style={{
									boxShadow:
										'0 4px 14px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(0, 0, 0, 0.15)',
									transition: 'transform 150ms ease, box-shadow 150ms ease',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.transform = 'scale(1.08)';
									e.currentTarget.style.boxShadow =
										'0 6px 20px rgba(0, 0, 0, 0.3), 0 3px 8px rgba(0, 0, 0, 0.2)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.transform = 'scale(1)';
									e.currentTarget.style.boxShadow =
										'0 4px 14px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(0, 0, 0, 0.15)';
								}}
							>
								<IconUsers size={26} />
							</ActionIcon>
						</Indicator>
					</Tooltip>
				</Popover.Target>
				<Popover.Dropdown p='xs'>
					<Stack gap={4}>
						{lecturers.map((lec, idx) => {
							const answered = answeredCount(lec);
							const total = questions.length;
							const pct = total > 0 ? (answered / total) * 100 : 0;
							const isCurrent = idx === currentIndex;
							const isComplete = answered === total;

							return (
								<UnstyledButton
									key={lec.assignedModuleId}
									onClick={() => {
										onNavigate(idx);
										close();
									}}
									py={8}
									px='sm'
									style={(theme) => ({
										borderRadius: theme.radius.md,
										backgroundColor: isCurrent
											? 'var(--mantine-color-blue-light)'
											: undefined,
										transition: 'background-color 120ms ease',
										'&:hover': {
											backgroundColor: 'var(--mantine-color-default-hover)',
										},
									})}
								>
									<Group wrap='nowrap' gap='sm'>
										<Avatar
											src={lec.lecturerImage}
											size={36}
											radius='xl'
											color={isComplete ? 'green' : 'blue'}
										>
											{isComplete ? (
												<IconCheck size={18} />
											) : (
												lec.lecturerName
													?.split(' ')
													.map((n) => n[0])
													.join('')
													.slice(0, 2)
													.toUpperCase()
											)}
										</Avatar>
										<Box style={{ flex: 1, minWidth: 0 }}>
											<Text size='sm' fw={isCurrent ? 600 : 400} truncate>
												{lec.lecturerName}
											</Text>
											<Text size='xs' c='dimmed' truncate>
												{lec.moduleCode}
											</Text>
											<Progress
												value={pct}
												size={4}
												radius='xl'
												mt={4}
												color={isComplete ? 'green' : 'blue'}
											/>
										</Box>
										<Text size='xs' c='dimmed' fw={500}>
											{answered}/{total}
										</Text>
									</Group>
								</UnstyledButton>
							);
						})}
					</Stack>
				</Popover.Dropdown>
			</Popover>
		</Box>
	);
}
