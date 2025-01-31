'use client';

import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { findAllTerms } from '@/server/terms/actions';
import { IconCheck } from '@tabler/icons-react';
import { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/terms'}
      queryKey={['terms']}
      getData={findAllTerms}
      actionIcons={[<NewLink key={'new-link'} href='/admin/terms/new' />]}
      renderItem={(it) => (
        <ListItem
          id={it.id}
          label={it.name}
          rightSection={
            it.isActive ? <IconCheck size={'1rem'} color='green' /> : null
          }
        />
      )}
    >
      {children}
    </ListLayout>
  );
}
