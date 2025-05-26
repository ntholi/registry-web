'use client';

import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { getAssignedModulesByCurrentUser } from '@/server/assigned-modules/actions';
import { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/assessments'}
      queryKey={['assessments']}
      getData={async (_, __) => {
        const data = await getAssignedModulesByCurrentUser();
        return {
          items: data,
          totalPages: 1,
        };
      }}
      actionIcons={[<NewLink key={'new-link'} href='/admin/assessments/new' />]}
      renderItem={(it) => (
        <ListItem
          id={it.id}
          label={it.semesterModule?.module?.code}
          description={it.semesterModule?.module?.name}
        />
      )}
    >
      {children}
    </ListLayout>
  );
}
