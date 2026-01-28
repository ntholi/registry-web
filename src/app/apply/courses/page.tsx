import {
	type ProgramLevel,
	programLevelEnum,
} from '@academic/schools/_schema/programs';
import type { EntryRequirementFilter } from '@admissions/entry-requirements/_lib/types';
import { getPublicCoursesData } from '@admissions/entry-requirements/_server/actions';
import {
	Badge,
	Box,
	Container,
	Divider,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { createLoader } from 'nuqs/server';
import ButtonLink from '@/shared/ui/ButtonLink';
import ApplyHeader from '../_components/ApplyHeader';
import CourseCard from './_components/CourseCard';
import CoursesFilters from './_components/CoursesFilters';
import CoursesPagination from './_components/CoursesPagination';
import { coursesSearchParams } from './_lib/params';

interface Props {
	searchParams: Promise<{
		schoolId?: string;
		level?: string;
		page?: string;
	}>;
}

const loadSearchParams = createLoader(coursesSearchParams);

export default async function ApplyCoursesPage({ searchParams }: Props) {
	const params = await searchParams;
	const { page: rawPage, schoolId, level } = loadSearchParams(params);
	const page = Math.max(1, rawPage);

	const filter: EntryRequirementFilter = {};
	if (schoolId) filter.schoolId = schoolId;
	if (level) filter.level = level as ProgramLevel;

	const { programs, schools, subjects } = await getPublicCoursesData(
		page,
		'',
		filter
	);

	return (
		<Box bg='var(--mantine-color-body)'>
			<ApplyHeader redirectIfRestricted={false} />
			<Container size='xl' py='xl' pt={100}>
				<Stack gap='xl'>
					<Stack gap='xs'>
						<Title order={1} fw={600}>
							Browse Courses
						</Title>
						<Text c='dimmed' size='sm' maw={720}>
							Explore programs that currently accept applications. Filter by
							school and program level to narrow your selection.
						</Text>
					</Stack>

					<Box>
						<CoursesFilters
							schools={schools}
							levels={programLevelEnum.enumValues}
						/>
						<Divider />
					</Box>

					<Group justify='space-between' align='center'>
						<Group gap='xs'>
							<Text fw={600}>Courses</Text>
							<Badge variant='light' color='gray'>
								{programs.totalItems} total
							</Badge>
						</Group>
						<ButtonLink href='/apply/new'>Apply now</ButtonLink>
					</Group>

					<Divider />

					{programs.items.length === 0 ? (
						<EmptyState />
					) : (
						<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='lg'>
							{programs.items.map((program) => (
								<CourseCard
									key={program.id}
									program={program}
									subjects={subjects}
								/>
							))}
						</SimpleGrid>
					)}

					<CoursesPagination page={page} total={programs.totalPages} />
				</Stack>
			</Container>
			<Footer />
		</Box>
	);
}

function EmptyState() {
	return (
		<Paper withBorder radius='lg' p='xl'>
			<Stack gap='sm' align='center'>
				<Title order={3} fw={500}>
					No courses match your filters
				</Title>
				<Text c='dimmed' ta='center' maw={520}>
					Try adjusting the school or program level filters to see more options.
				</Text>
			</Stack>
		</Paper>
	);
}

function Footer() {
	return (
		<Paper component='footer' withBorder radius={0} py='xl'>
			<Container size='xl'>
				<Stack gap='xs' align='center'>
					<Text size='sm' c='dimmed'>
						© {new Date().getFullYear()} Limkokwing University of Creative
						Technology, Lesotho.
					</Text>
				</Stack>
			</Container>
		</Paper>
	);
}
