'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { getAssessments } from '@/server/assessments/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/assessments'}
      queryKey={['assessments']}
      getData={getAssessments}
      actionIcons={[<NewLink key={'new-link'} href='/admin/assessments/new' />]}
      renderItem={(it) => <ListItem id={it.id} label={it.id} />}
    >
      {children}
    </ListLayout>
  );
}