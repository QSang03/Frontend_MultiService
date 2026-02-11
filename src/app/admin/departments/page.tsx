'use client';
import { redirect } from 'next/navigation';

export default function DepartmentsRedirectPage() {
  // Redirect legacy /departments route into the new Departments tab under /admin/users
  redirect('/admin/users?tab=departments');
}
