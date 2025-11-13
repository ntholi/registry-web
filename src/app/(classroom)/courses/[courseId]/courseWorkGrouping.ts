import type { CourseWork, Topic } from '@/server/classroom/actions';

export type TopicGroup = {
	id: string;
	name: string;
	items: CourseWork[];
};

export function groupCourseWorkByTopic(
	works: CourseWork[],
	topics: Topic[]
): TopicGroup[] {
	const topicMap = new Map(
		topics.map((topic) => [topic.topicId, topic.name || 'Untitled'])
	);
	const grouped = new Map<string, CourseWork[]>();

	works.forEach((work) => {
		const topicId = work.topicId || 'no-topic';
		if (!grouped.has(topicId)) {
			grouped.set(topicId, []);
		}
		grouped.get(topicId)?.push(work);
	});

	return Array.from(grouped.entries())
		.sort(([a], [b]) => {
			if (a === 'no-topic') return 1;
			if (b === 'no-topic') return -1;
			return 0;
		})
		.map(([id, items]) => ({
			id,
			name: id === 'no-topic' ? 'General' : topicMap.get(id) || 'Topic',
			items,
		}));
}
