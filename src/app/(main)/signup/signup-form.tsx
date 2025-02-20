'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { createSignup, getSignup } from '@/server/signups/actions';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircleIcon,
  InfoIcon,
  XCircleIcon,
  AlertCircle,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  stdNo: z.string().regex(/^9010\d{5}$/, {
    message: 'Student number must be a 9-digit number starting with 9010.',
  }),
});

type SignupFormProps = {
  existingSignup: Awaited<ReturnType<typeof getSignup>>;
};

export function SignupForm({ existingSignup }: SignupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingSignup?.name || session?.user?.name || '',
      stdNo: existingSignup?.stdNo || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      if (session?.user?.id) {
        await createSignup({
          ...values,
          userId: session.user.id,
          name: values.name.trim(),
          stdNo: values.stdNo.trim(),
        });
        toast.success('Registration submitted successfully');
        router.refresh();
      }
    } catch (error) {
      toast.error('Failed to submit registration');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className='w-full sm:w-1/2'>
      <CardContent className='p-6'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.trim())}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter your full name as it appears in your student record.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='stdNo'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.trim())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {existingSignup?.message && (
              <Alert
                className={cn('border', getAlertStyles(existingSignup.status))}
              >
                {getAlertIcon(existingSignup.status)}
                <AlertTitle className='capitalize'>
                  {existingSignup.status}
                </AlertTitle>
                <AlertDescription>{existingSignup.message}</AlertDescription>
              </Alert>
            )}

            <Button
              className='w-full sm:w-auto'
              type='submit'
              disabled={isSubmitting}
            >
              {existingSignup ? 'Update Details' : 'Sign up'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className='rounded-lg rounded-t-none bg-yellow-50/10 p-4 text-yellow-500'>
        <div className='flex items-start'>
          <AlertCircle className='mr-2 h-5 w-5 flex-shrink-0' />
          <p className='text-[0.81rem]'>
            This app is currently in beta testing. If you encounter any issues,
            please report them to the Registry Department.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}

const getAlertStyles = (status: string) => {
  switch (status) {
    case 'approved':
      return 'text-green-800 dark:text-green-100 border-green-300 dark:border-green-700';
    case 'rejected':
      return 'text-red-800 dark:text-red-100 border-red-300 dark:border-red-700';
    default:
      return 'text-yellow-800 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700';
  }
};

const getAlertIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return <CheckCircleIcon className='size-4' />;
    case 'rejected':
      return <XCircleIcon className='size-4' />;
    default:
      return <InfoIcon className='size-4' />;
  }
};
