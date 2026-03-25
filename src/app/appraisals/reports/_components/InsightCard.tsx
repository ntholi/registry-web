'use client';

import {
	Badge,
	Card,
	Group,
	List,
	ListItem,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconAlertTriangle,
	IconBuilding,
	IconChartBar,
	IconChecklist,
	IconFileText,
	IconMoodSmile,
	IconSchool,
	IconThumbUp,
	IconTrendingUp,
	IconUser,
} from '@tabler/icons-react';
import type { InsightCard as InsightCardType } from '../_lib/types';

type Props = {
	card: InsightCardType;
};

const CATEGORY_CONFIG: Record<
	string,
	{ icon: React.ElementType; color: string }
> = {
	'executive-summary': { icon: IconFileText, color: 'blue' },
	strengths: { icon: IconThumbUp, color: 'green' },
	concerns: { icon: IconAlertTriangle, color: 'red' },
	training: { icon: IconSchool, color: 'violet' },
	trends: { icon: IconTrendingUp, color: 'cyan' },
	'school-highlights': { icon: IconBuilding, color: 'orange' },
	'student-sentiment': { icon: IconMoodSmile, color: 'teal' },
	'action-items': { icon: IconChecklist, color: 'indigo' },
	'lecturer-spotlights': { icon: IconUser, color: 'grape' },
	'category-insights': { icon: IconChartBar, color: 'yellow' },
};

export default function InsightCard({ card }: Props) {
	const config = CATEGORY_CONFIG[card.category] ?? {
		icon: IconFileText,
		color: 'gray',
	};
	const Icon = config.icon;

	return (
		<Card withBorder shadow='sm' radius='md' h='100%'>
			<Stack gap='sm'>
				<Group gap='sm'>
					<ThemeIcon variant='light' color={config.color} size='md'>
						<Icon size={16} />
					</ThemeIcon>
					<Text fw={600} size='sm' style={{ flex: 1 }}>
						{card.title}
					</Text>
				</Group>

				<List size='sm' spacing='xs'>
					{card.items.map((item, i) => (
						<ListItem key={i}>
							<Stack gap={2}>
								<Text size='sm'>{item.text}</Text>
								{(item.lecturerName || item.moduleName) && (
									<Text size='xs' c='dimmed'>
										{[
											item.lecturerName && `Lecturer: ${item.lecturerName}`,
											item.moduleName && `Module: ${item.moduleName}`,
											item.schoolCode && `(${item.schoolCode})`,
										]
											.filter(Boolean)
											.join(' · ')}
									</Text>
								)}
							</Stack>
						</ListItem>
					))}
				</List>

				{card.tags.length > 0 && (
					<Group gap={4} mt='xs'>
						{card.tags.map((tag) => (
							<Badge key={tag} size='xs' variant='light' color={config.color}>
								{tag}
							</Badge>
						))}
					</Group>
				)}
			</Stack>
		</Card>
	);
}
