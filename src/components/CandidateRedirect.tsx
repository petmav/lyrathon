"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function CandidateRedirect(): null {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const recruiterId = localStorage.getItem('recruiter_id');
      const candidateId = localStorage.getItem('candidate_id');

      // If recruiter is logged in, send to recruiter page (highest priority)
      if (recruiterId) {
        if (!(pathname && pathname.startsWith('/recruiter_query_page'))) {
          router.replace('/recruiter_query_page');
        }
        return;
      }

      if (candidateId) {
        // avoid redirect loop
        if (pathname && pathname.startsWith('/applicant')) return;

        router.replace('/applicant');
      }
    } catch (err) {
      // ignore
    }
  }, [pathname, router]);

  return null;
}
