'use client';

import { ListItem, ListLayout } from '@/components/adease';
import { getAssignedModulesByCurrentUser } from '@/server/assigned-modules/actions';
import { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/assessments'}
      queryKey={['assessments']}
      getData={async () => {
        const data = await getAssignedModulesByCurrentUser();
        return {
          items: data,
          totalPages: 1,
        };
      }}
      renderItem={(it) => (
        <ListItem
          id={it.semesterModule?.moduleId ?? '#'}
          label={it.semesterModule?.module?.code}
          description={it.semesterModule?.module?.name}
        />
      )}
    >
      {children}
    </ListLayout>
  );
}
