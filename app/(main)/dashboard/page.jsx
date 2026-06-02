import { getIndustryInsights, getJobRecommendations } from "@/actions/dashboard";
import DashboardView from "./_components/dashboard-view";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  // If not onboarded, redirect to onboarding page
  // Skip this check if already on the onboarding page
  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const insights = await getIndustryInsights();
  let recommendations = [];

  try {
    const jobRecommendationResult = await getJobRecommendations();
    recommendations = jobRecommendationResult?.recommendedRoles ?? [];
  } catch (error) {
    console.error("Failed to load job recommendations:", error);
    // keep recommendations as an empty array so the page can still render
    recommendations = [];
  }

  return (
    <div className="container mx-auto">
      <DashboardView insights={insights} recommendations={recommendations} />
    </div>
  );
}