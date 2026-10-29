"use client";

import ProfileView from "@/components/routing/ProfileView";
import LawyerIntro from "@/components/lawyer/LawyerIntro";
import { ownProfileAdapter } from "@/lib/routing";

export default function LawyerProfilePage() {
  return <ProfileView adapter={ownProfileAdapter} intro={<LawyerIntro screen="profile" flush />} />;
}
