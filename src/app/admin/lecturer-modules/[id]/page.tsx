import {
  DetailsView,
  DetailsViewHeader,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import {
  getLecturesModule,
  deleteLecturesModule,
} from '@/server/lecturer-modules/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import { Button, Card, Flex, Grid, GridCol, Stack, Title } from '@mantine/core';
import { IconNotebook } from '@tabler/icons-react';
import Link from 'next/link';
import AssessmentsManager from './assessments/AssessmentsManager';

type Props = {
  params: { id: string };
};

export default async function LecturesModuleDetails({ params }: Props) {
  const { id } = params;
  const lecturesModule = await getLecturesModule(Number(id));
  const currentTerm = await getCurrentTerm();

  if (!lecturesModule) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={lecturesModule.semesterModule.name}
        queryKey={['lecturerModules']}
        handleDelete={async () => {
          'use server';
          await deleteLecturesModule(Number(id));
        }}
      />
      <DetailsViewBody>
        <Grid gutter='xl'>
          <GridCol span={12}>
            <Card withBorder p='md' radius='md'>
              <Stack>
                <Flex justify='space-between' align='center'>
                  <Title order={4} fw={500}>
                    Assessment Management
                  </Title>
                  <Button
                    variant='light'
                    color='blue'
                    component={Link}
                    href={`/admin/lecturer-modules/${id}/gradebook`}
                    leftSection={<IconNotebook size='1.2rem' />}
                  >
                    Gradebook
                  </Button>
                </Flex>
              </Stack>
            </Card>
          </GridCol>

          <GridCol span={12}>
            <AssessmentsManager
              semesterModuleId={lecturesModule.semesterModuleId}
              lecturesModuleId={Number(id)}
            />
          </GridCol>
        </Grid>
      </DetailsViewBody>
    </DetailsView>
  );
}
