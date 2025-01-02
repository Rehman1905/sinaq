'use client';

import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import React, { useEffect, useState } from 'react';
import { GithubAuthProvider } from 'firebase/auth';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import Link from 'next/link';
import { firestore } from "../../../firebase/clientApp";
import { collection, getDocs } from "firebase/firestore";
import { redirect } from 'next/navigation';

const uiConfig = {
  signInSuccessUrl: '/',
  signInOptions: [GithubAuthProvider.PROVIDER_ID],
};

const FormSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must have more than 8 characters'),
});

const SignInForm = () => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const [users, setUsers] = useState<{ email: string; password: string, username: string }[]>([]);

  const fetchCollectionData = async () => {
    const querySnapshot = await getDocs(collection(firestore, "users"));
    const fetchedUsers: { email: string; password: string; username: string }[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data?.values?.email && data?.values?.password) {
        fetchedUsers.push({
          email: data.values.email,
          password: data.values.password,
          username: data.values.username,
        });
      }
    });

    setUsers(fetchedUsers);
  };

  useEffect(() => {
    fetchCollectionData();
  }, []);

  const setLocalStorageWithExpiry = (key: string, value: any, expiryInHours: number) => {
    const now = new Date();
    const expiryTime = now.getTime() + expiryInHours * 60 * 60 * 1000;

    const item = {
      value: value,
      expiry: expiryTime,
    };

    localStorage.setItem(key, JSON.stringify(item));
  };

  const onSubmit = (values: z.infer<typeof FormSchema>) => {
    const saveData = async () => {
      let count = 0;
      for (let i in users) {
        if (values.email === users[i].email && values.password === users[i].password) {
          count++;
          form.reset();
          const userData = { email: users[i].email, username: users[i].username };
          setLocalStorageWithExpiry("user", userData, 1); // LocalStorage'a istifadəçi məlumatları əlavə edilir
          redirect('/'); // Ana səhifəyə yönləndir
          break; // Uğurlu daxilolma halında dövrü dayandır
        }
      }
      if (!count) {
        alert("If you don't have an account, please Sign up");
      }
    };
    saveData();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="mail@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button className="w-full mt-6" type="submit">
          Sign in
        </Button>
      </form>
      <div className="mx-auto my-4 flex w-full items-center justify-evenly before:mr-4 before:block before:h-px before:flex-grow before:bg-stone-400 after:ml-4 after:block after:h-px after:flex-grow after:bg-stone-400">
        or
      </div>
      {/* <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} /> */}
      <p className="text-center text-sm text-gray-600 mt-2">
        If you dont have an account, please;
        <Link className="text-blue-500 hover:underline" href="/sign-up">
          Sign up
        </Link>
      </p>
    </Form>
  );
};

export default SignInForm;
