'use client';

import {
	Group,
	Paper,
	Popover,
	Rating,
	Stack,
	Text,
	Textarea,
} from '@mantine/core';

const RATING_LABELS = ['Poor', 'Fair', 'Satisfactory', 'Good', 'Excellent'];

type Props = {
	categoryName: string;
	questionText: string;
	rating: number | null;
	comment: string;
	questionIndex: number;
	totalQuestions: number;
	onRatingChange: (rating: number) => void;
	onCommentChange: (comment: string) => void;
};

export default function QuestionCard({
	categoryName,
	questionText,
	rating,
	comment,
	questionIndex,
	totalQuestions,
	onRatingChange,
	onCommentChange,
}: Props) {
	const label = rating ? RATING_LABELS[rating - 1] : undefined;

	return (
		<Paper p='md' px={0} radius='lg' bg='transparent'>
			<Stack gap='xl'>
				<Group justify='space-between' align='center'>
					<Text size='xs' tt='uppercase' fw={700} c='dimmed' lts={1}>
						{categoryName}
					</Text>
					<Text size='xs' fw={600}>
						{questionIndex + 1} / {totalQuestions}
					</Text>
				</Group>

				<Text size='lg' fw={600} lh={1.4} ta='center' py='xs'>
					{questionText}
				</Text>

				<Stack gap={6} align='center'>
					<Popover opened={!!label} position='top' withArrow shadow='md'>
						<Popover.Target>
							<Rating
								size='xl'
								count={5}
								value={rating ?? 0}
								onChange={onRatingChange}
							/>
						</Popover.Target>
						<Popover.Dropdown px='md' py={6}>
							<Text size='sm' fw={600} ta='center'>
								{label}
							</Text>
						</Popover.Dropdown>
					</Popover>
				</Stack>

				<Textarea
					placeholder='Add a comment (optional)'
					autosize
					minRows={2}
					maxRows={5}
					value={comment}
					onChange={(e) => onCommentChange(e.currentTarget.value)}
					variant='filled'
				/>
			</Stack>
		</Paper>
	);
}
