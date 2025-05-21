'use client';

import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { getAssignedModulesByLecturer } from '@/server/assigned-modules/actions';
import { useSession } from 'next-auth/react';
import { unauthorized } from 'next/navigation';
import { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  const { data: session } = useSession();

  return (
    <ListLayout
      path={'/admin/assessments'}
      queryKey={['assessments']}
      getData={async (_, __) => {
        if (!session?.user?.id) {
          return { items: [], totalPages: 0 };
        }
        const data = await getAssignedModulesByLecturer(session.user.id);
        return {
          items: data,
          totalPages: 1,
        };
      }}
      actionIcons={[<NewLink key={'new-link'} href='/admin/assessments/new' />]}
      renderItem={(it) => (
        <ListItem id={it.id} label={it.code} description={it.name} />
      )}
    >
      {children}
    </ListLayout>
  );
}
