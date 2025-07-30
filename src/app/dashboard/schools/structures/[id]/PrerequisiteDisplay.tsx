import { Anchor, Group, Text } from '@mantine/core';
import Link from 'next/link';
import { Fragment } from 'react';

type Prerequisite = {
  id: number;
  prerequisite: {
    id: number;
    module: {
      id: number;
      code: string;
      name: string;
    } | null;
  };
};

type Props = {
  prerequisites: Prerequisite[];
  hidden: boolean;
};

export default function PrerequisiteDisplay({ prerequisites, hidden }: Props) {
  if (!prerequisites || prerequisites.length === 0) {
    return (
      <Text size='sm' c='dimmed'>
        None
      </Text>
    );
  }

  return (
    <Group gap={'xs'}>
      {prerequisites.map((it, i) => (
        <Fragment key={it.id}>
          <Group gap={'xs'}>
            <Anchor
              component={Link}
              c={hidden ? 'dark' : undefined}
              href={`/dashboard/semester-modules/${it.prerequisite.id}`}
              size='0.8rem'
            >
              {it.prerequisite.module?.code}
            </Anchor>
            <Text size='0.8rem'>{it.prerequisite.module?.name}</Text>
          </Group>
          {prerequisites.length > 1 && i < prerequisites.length - 1 && ','}
        </Fragment>
      ))}
    </Group>
  );
}
