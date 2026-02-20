'use client';

import {
	Box,
	Divider,
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
	onRatingChange: (rating: number) => void;
	onCommentChange: (comment: string) => void;
};

export default function QuestionCard({
	categoryName,
	questionText,
	rating,
	comment,
	onRatingChange,
	onCommentChange,
}: Props) {
	const label = rating ? RATING_LABELS[rating - 1] : undefined;

	return (
		<Paper withBorder p='lg' radius='md'>
			<Stack gap='md'>
				<Box>
					<Text size='sm'>{categoryName}</Text>
					<Divider my='xs' />
				</Box>

				<Text size='lg' fw={500}>
					{questionText}
				</Text>

				<Stack gap={4} align='center'>
					<Popover opened={!!label} position='top' withArrow shadow='sm'>
						<Popover.Target>
							<Rating
								size='xl'
								count={5}
								value={rating ?? 0}
								onChange={onRatingChange}
							/>
						</Popover.Target>
						<Popover.Dropdown p='xs'>
							<Text size='sm' fw={500} ta='center'>
								{label}
							</Text>
						</Popover.Dropdown>
					</Popover>
				</Stack>

				<Textarea
					placeholder='Add a comment (optional)'
					autosize
					minRows={2}
					maxRows={4}
					value={comment}
					onChange={(e) => onCommentChange(e.currentTarget.value)}
				/>
			</Stack>
		</Paper>
	);
}
