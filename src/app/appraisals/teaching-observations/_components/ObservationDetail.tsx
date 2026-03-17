'use client';

import {
	Badge,
	Card,
	Divider,
	Group,
	SegmentedControl,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { useMemo } from 'react';
import { formatDate } from '@/shared/lib/utils/dates';
import { FieldView } from '@/shared/ui/adease';

type Rating = {
	id: string;
	rating: number | null;
	criterion: {
		id: string;
		text: string;
		description: string | null;
		sortOrder: number;
		category: {
			id: string;
			name: string;
			section: 'teaching_observation' | 'assessments' | 'other';
			sortOrder: number;
		};
	};
};

type ObservationData = {
	id: string;
	status: string;
	strengths: string | null;
	improvements: string | null;
	recommendations: string | null;
	trainingArea: string | null;
	submittedAt: Date | null;
	acknowledgedAt: Date | null;
	acknowledgmentComment: string | null;
	createdAt: Date | null;
	cycle: { name: string } | null;
	observer: { name: string } | null;
	assignedModule: {
		user: { name: string } | null;
		semesterModule: {
			module: { code: string; name: string } | null;
			semester: {
				structure: {
					program: { code: string; name: string } | null;
				} | null;
			} | null;
		} | null;
	} | null;
	ratings: Rating[];
};

type ObservationDetailProps = {
	observation: ObservationData;
};

const SECTION_LABELS: Record<string, string> = {
	teaching_observation: 'Teaching Observation',
	assessments: 'Assessments',
	other: 'Other',
};

const STATUS_COLORS: Record<string, string> = {
	draft: 'gray',
	submitted: 'blue',
	acknowledged: 'green',
};

const RATINGS = ['1', '2', '3', '4', '5'];

export default function ObservationDetail({
	observation: obs,
}: ObservationDetailProps) {
	const sm = obs.assignedModule?.semesterModule;
	const mod = sm?.module;
	const prog = sm?.semester?.structure?.program;

	const grouped = useMemo(() => {
		const sections = new Map<
			string,
			Map<string, { name: string; sortOrder: number; ratings: Rating[] }>
		>();
		for (const r of obs.ratings) {
			const section = r.criterion.category.section;
			if (!sections.has(section)) sections.set(section, new Map());
			const cats = sections.get(section)!;
			const catId = r.criterion.category.id;
			if (!cats.has(catId))
				cats.set(catId, {
					name: r.criterion.category.name,
					sortOrder: r.criterion.category.sortOrder,
					ratings: [],
				});
			cats.get(catId)!.ratings.push(r);
		}
		for (const cats of sections.values()) {
			for (const cat of cats.values()) {
				cat.ratings.sort(
					(a, b) => a.criterion.sortOrder - b.criterion.sortOrder
				);
			}
		}
		return sections;
	}, [obs.ratings]);

	const sectionAverages = useMemo(() => {
		const avgs: Record<string, number> = {};
		for (const [section, cats] of grouped) {
			const ratings = Array.from(cats.values()).flatMap((c) =>
				c.ratings.filter((r) => r.rating != null).map((r) => r.rating!)
			);
			if (ratings.length > 0) {
				avgs[section] = ratings.reduce((a, b) => a + b, 0) / ratings.length;
			}
		}
		return avgs;
	}, [grouped]);

	const allRatings = obs.ratings
		.filter((r) => r.rating != null)
		.map((r) => r.rating!);
	const overallAvg =
		allRatings.length > 0
			? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
			: null;

	return (
		<Stack gap='lg'>
			<Group justify='space-between' align='flex-start'>
				<Stack gap='xs'>
					<FieldView label='Cycle'>{obs.cycle?.name}</FieldView>
					<FieldView label='Lecturer'>
						{obs.assignedModule?.user?.name}
					</FieldView>
					<FieldView label='Module'>
						{mod ? `${mod.code} — ${mod.name}` : null}
					</FieldView>
					{prog && (
						<FieldView label='Programme'>
							{prog.code} — {prog.name}
						</FieldView>
					)}
					<FieldView label='Observer'>{obs.observer?.name}</FieldView>
					<FieldView label='Date'>
						{obs.createdAt ? formatDate(obs.createdAt) : null}
					</FieldView>
				</Stack>
				<Stack gap='xs' align='flex-end'>
					<Badge
						size='lg'
						variant='light'
						color={STATUS_COLORS[obs.status] ?? 'gray'}
					>
						{obs.status}
					</Badge>
					{overallAvg != null && (
						<Badge size='lg' variant='filled' color='indigo'>
							{overallAvg.toFixed(2)} / 5
						</Badge>
					)}
				</Stack>
			</Group>

			<Divider />

			{(['teaching_observation', 'assessments', 'other'] as const).map(
				(section) => {
					const cats = grouped.get(section);
					if (!cats) return null;
					return (
						<Card key={section} withBorder>
							<Group justify='space-between' mb='sm'>
								<Title order={5}>{SECTION_LABELS[section]}</Title>
								{sectionAverages[section] != null && (
									<Badge variant='light' color='indigo'>
										Avg: {sectionAverages[section].toFixed(2)}
									</Badge>
								)}
							</Group>
							<Stack gap='md'>
								{Array.from(cats.entries()).map(
									([catId, { name, ratings }]) => (
										<Stack key={catId} gap='xs'>
											<Text fw={600} size='sm' c='dimmed'>
												{name}
											</Text>
											{ratings.map((r) => (
												<Group
													key={r.id}
													justify='space-between'
													wrap='nowrap'
													align='flex-start'
												>
													<Stack gap={2} style={{ flex: 1 }}>
														<Text size='sm' fw={500}>
															{r.criterion.text}
														</Text>
														{r.criterion.description && (
															<Text size='xs' c='dimmed'>
																{r.criterion.description}
															</Text>
														)}
													</Stack>
													<SegmentedControl
														size='xs'
														readOnly
														data={RATINGS}
														value={r.rating?.toString() ?? ''}
													/>
												</Group>
											))}
										</Stack>
									)
								)}
							</Stack>
						</Card>
					);
				}
			)}

			<Card withBorder>
				<Title order={5} mb='sm'>
					Remarks
				</Title>
				<Stack gap='md'>
					<FieldView label='Strengths'>{obs.strengths}</FieldView>
					<FieldView label='Areas for Improvement'>
						{obs.improvements}
					</FieldView>
					<FieldView label='Recommendations'>{obs.recommendations}</FieldView>
					<FieldView label='Identified Training Area'>
						{obs.trainingArea}
					</FieldView>
				</Stack>
			</Card>

			{obs.status === 'acknowledged' && (
				<Card withBorder>
					<Title order={5} mb='sm'>
						Acknowledgment
					</Title>
					<Stack gap='sm'>
						<FieldView label='Acknowledged At'>
							{obs.acknowledgedAt ? formatDate(obs.acknowledgedAt) : null}
						</FieldView>
						{obs.acknowledgmentComment && (
							<FieldView label='Comment'>{obs.acknowledgmentComment}</FieldView>
						)}
					</Stack>
				</Card>
			)}
		</Stack>
	);
}
