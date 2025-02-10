'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Logo from './base/Logo';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className='flex h-screen items-center justify-center p-4'>
      <Logo
        width={500}
        height={500}
        className='absolute left-1/2 top-0 mt-8 h-40 w-auto -translate-x-1/2  md:mt-16'
      />
      <Card className='w-full max-w-md overflow-hidden shadow-xl'>
        <div className='bg-red-500 p-2'></div>
        <CardHeader className='space-y-1'>
          <div className='flex items-center gap-2'>
            <AlertCircle className='h-6 w-6 text-red-500' />
            <CardTitle className='text-3xl font-normal'>
              Something Went Wrong
            </CardTitle>
          </div>
          <CardDescription className='text-base font-medium text-red-400'>
            {error.message}
          </CardDescription>
          {error.digest && (
            <CardDescription className='text-xs text-muted-foreground'>
              Error ID: {error.digest}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className='pb-6'>
          <Button onClick={reset} variant='default' className='w-full'>
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
