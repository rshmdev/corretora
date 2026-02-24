import { redirect } from 'next/navigation';

export default function AffRedirectPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const ref = (Array.isArray(searchParams.ref) ? searchParams.ref[0] : searchParams.ref)
    || (Array.isArray(searchParams.referral) ? searchParams.referral[0] : searchParams.referral)
    || (Array.isArray(searchParams.code) ? searchParams.code[0] : searchParams.code)
    || '';

  const target = ref ? `/auth/register?ref=${encodeURIComponent(ref)}` : '/auth/register';
  redirect(target);
}


