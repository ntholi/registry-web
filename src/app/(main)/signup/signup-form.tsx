'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { createSignup, getSignup } from '@/server/signups/actions';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

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
          userId: session?.user?.id,
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
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {existingSignup?.message && (
              <Alert>
                <InfoIcon className='h-4 w-4' />
                <AlertTitle>Status</AlertTitle>
                <AlertDescription>{existingSignup.message}</AlertDescription>
              </Alert>
            )}

            <Button
              className='w-full sm:w-auto'
              type='submit'
              disabled={isSubmitting}
            >
              {existingSignup ? 'Update Registration' : 'Submit Registration'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
