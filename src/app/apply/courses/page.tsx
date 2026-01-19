import {
	type ProgramLevel,
	programLevelEnum,
} from '@academic/schools/_schema/programs';
import type {
	EntryRequirementFilter,
	ProgramWithSchool,
} from '@admissions/entry-requirements/_lib/types';
import {
	findEntryRequirementSchoolsPublic,
	findProgramsWithRequirementsPublic,
} from '@admissions/entry-requirements/_server/actions';
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
import ButtonLink from '@/shared/ui/ButtonLink';
import CoursesFilters from './_components/CoursesFilters';
import CoursesPagination from './_components/CoursesPagination';

interface ApplyCoursesPageProps {
	searchParams?: {
		schoolId?: string | string[];
		level?: string | string[];
		page?: string | string[];
	};
}

export default async function ApplyCoursesPage({
	searchParams,
}: ApplyCoursesPageProps) {
	const page = parsePositiveNumber(searchParams?.page) ?? 1;
	const schoolId = parsePositiveNumber(searchParams?.schoolId);
	const level = parseProgramLevel(searchParams?.level);

	const filter: EntryRequirementFilter = {
		...(schoolId ? { schoolId } : {}),
		...(level ? { level } : {}),
	};

	const [schools, programs] = await Promise.all([
		findEntryRequirementSchoolsPublic(),
		findProgramsWithRequirementsPublic(page, '', filter),
	]);

	return (
		<Box bg='var(--mantine-color-body)'>
			<Header />
			<Container size='xl' py='xl'>
				<Stack gap='xl'>
					<Stack gap='xs'>
						<Text size='xs' c='dimmed' tt='uppercase' fw={600}>
							Limkokwing University
						</Text>
						<Title order={1} fw={600}>
							Browse available courses
						</Title>
						<Text c='dimmed' maw={720}>
							Explore programs that currently accept applications. Filter by
							school and program level to narrow your selection.
						</Text>
					</Stack>

					<Paper withBorder radius='lg' p='lg'>
						<CoursesFilters
							schools={schools}
							levels={programLevelEnum.enumValues}
							value={{ schoolId, level }}
						/>
					</Paper>

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
								<CourseCard key={program.id} program={program} />
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

function Header() {
	return (
		<Paper component='header' withBorder radius={0} py='md'>
			<Container size='xl'>
				<Group justify='space-between'>
					<Stack gap={2}>
						<Text fw={700}>Limkokwing University</Text>
						<Text size='xs' c='dimmed'>
							Course catalogue
						</Text>
					</Stack>
					<Group>
						<ButtonLink href='/auth/login' variant='default'>
							Sign in
						</ButtonLink>
					</Group>
				</Group>
			</Container>
		</Paper>
	);
}

interface CourseCardProps {
	program: ProgramWithSchool;
}

function CourseCard({ program }: CourseCardProps) {
	return (
		<Paper withBorder radius='lg' p='lg' h='100%'>
			<Stack gap='sm'>
				<Group justify='space-between' align='flex-start'>
					<Stack gap={4}>
						<Text fw={600}>{program.name}</Text>
						<Text size='sm' c='dimmed'>
							{program.code}
						</Text>
					</Stack>
					<Badge variant='light'>{levelLabel(program.level)}</Badge>
				</Group>

				<Divider />

				<Stack gap={6}>
					<Text size='sm' c='dimmed'>
						School
					</Text>
					<Group gap='xs'>
						<Text fw={500}>{program.school.name}</Text>
						<Badge variant='outline' color='gray'>
							{program.school.code}
						</Badge>
					</Group>
				</Stack>
			</Stack>
		</Paper>
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

function parsePositiveNumber(value?: string | string[]) {
	if (!value || Array.isArray(value)) {
		return undefined;
	}

	const parsed = Number(value);

	if (!Number.isFinite(parsed) || parsed <= 0) {
		return undefined;
	}

	return parsed;
}

function parseProgramLevel(
	value?: string | string[]
): ProgramLevel | undefined {
	if (!value || Array.isArray(value)) {
		return undefined;
	}

	const allowedLevels = programLevelEnum.enumValues;

	if (!allowedLevels.includes(value as ProgramLevel)) {
		return undefined;
	}

	return value as ProgramLevel;
}

function levelLabel(level: ProgramWithSchool['level']) {
	return `${level.charAt(0).toUpperCase()}${level.slice(1)}`;
}
