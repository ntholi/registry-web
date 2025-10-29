'use client';
import NextLink, { LinkProps } from 'next/link';
import { AnchorProps, Anchor } from '@mantine/core';

type Props = AnchorProps &
  LinkProps & {
    children: React.ReactNode;
  };

export default function Link(props: Props) {
  return <Anchor component={NextLink} {...props} />;
}
