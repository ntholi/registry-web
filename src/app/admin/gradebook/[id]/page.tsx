import {
  DetailsView,
  DetailsViewHeader,
  DetailsViewBody,
  FieldView,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getLecturesModule } from '@/server/lecturer-modules/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import { Grid, GridCol } from '@mantine/core';
import AssessmentsManager from '../../lecturer-modules/[id]/assessments/AssessmentsManager';

type Props = {
  params: { id: string };
};

export default async function GradebookModuleView({ params }: Props) {
  const { id } = params;
  const lecturesModule = await getLecturesModule(Number(id));
  const currentTerm = await getCurrentTerm();

  if (!lecturesModule) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader title={'Gradebook'} queryKey={['lecturerModules']} />
      <DetailsViewBody>
        <Grid gutter='xl'>
          <GridCol span={12}>
            <FieldView label={lecturesModule.semesterModule.code}>
              {lecturesModule.semesterModule.name}
            </FieldView>
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
