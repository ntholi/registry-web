'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { findAllStudents } from '@/server/students/actions';
import StudentsFilter from './StudentsFilter';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/students'}
      queryKey={['students']}
      getData={findAllStudents}
      actionIcons={[<StudentsFilter key={'filter-link'} />]}
      renderItem={(it) => (
        <ListItem id={it.stdNo} label={it.name} description={it.stdNo} />
      )}
    >
      {children}
    </ListLayout>
  );
}
