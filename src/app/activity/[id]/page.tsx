"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import { apiClient } from "@/lib/api-client";
import { getImageUrl, type Activity } from "@/types/hotel";

export default function ActivityDetailPage() {
  const params = useParams();
  const activityId = params.id as string;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadActivity() {
      try {
        setIsLoading(true);
        const data = await apiClient.getActivityById(activityId);
        setActivity(data);
      } catch (err) {
        console.error("Failed to load activity:", err);
        setError("Activity not found");
      } finally {
        setIsLoading(false);
      }
    }

    if (activityId) {
      loadActivity();
    }
  }, [activityId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <TopBar activeLink="More Dreams" />
        <div className="flex items-center justify-center py-40">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-dark border-t-transparent"></div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !activity) {
    return (
      <main className="min-h-screen bg-background">
        <TopBar activeLink="More Dreams" />
        <div className="flex flex-col items-center justify-center py-40">
          <h1 className="font-primary text-[42px] italic text-green-dark">
            Activity Not Found
          </h1>
          <p className="mt-4 text-gray-text">
            The activity you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/more-dreams"
            className="mt-8 rounded-full bg-green-dark px-8 py-3 text-[13px] font-semibold text-white hover:bg-green-dark/90"
          >
            Back to More Dreams
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const badge = activity.category
    ? activity.category.toUpperCase()
    : "ACTIVITY";

  return (
    <main className="min-h-screen bg-background">
      <TopBar activeLink="More Dreams" />

      {/* Hero */}
      <section className="relative h-[560px] w-full overflow-hidden">
        <img
          src={getImageUrl(activity.image)}
          alt={activity.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end px-20 pb-16">
          <span className="mb-3 inline-block w-fit rounded-full bg-gold/90 px-4 py-1.5 text-[11px] font-semibold tracking-[2px] text-white">
            {badge}
          </span>
          <h1 className="font-primary text-[56px] font-normal italic leading-none text-white">
            {activity.name}
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-white/70">
            {activity.description}
          </p>
        </div>
      </section>

      {/* About */}
      <section className="bg-white px-20 py-20">
        <div className="mx-auto flex max-w-7xl items-start gap-16">
          <div className="flex-1">
            <span className="text-[11px] font-semibold tracking-[4px] text-gold">
              ABOUT THIS EXPERIENCE
            </span>
            <h2 className="mt-3 font-primary text-[38px] italic leading-snug text-green-dark">
              {activity.name}
            </h2>
            <p className="mt-5 text-[15px] leading-[1.8] text-gray-text">
              {activity.description}
            </p>
            <div className="mt-8 flex gap-12">
              {activity.review_summary && (
                <div>
                  <p className="font-primary text-[32px] font-semibold text-green-dark">
                    {activity.review_summary.average_rating.toFixed(1)}
                  </p>
                  <p className="text-[12px] text-gray-text">
                    Rating (out of 5)
                  </p>
                </div>
              )}
              {activity.review_summary && (
                <div>
                  <p className="font-primary text-[32px] font-semibold text-green-dark">
                    {activity.review_summary.total_reviews}
                  </p>
                  <p className="text-[12px] text-gray-text">Reviews</p>
                </div>
              )}
              {activity.visit_duration && (
                <div>
                  <p className="font-primary text-[32px] font-semibold text-green-dark">
                    {activity.visit_duration}
                  </p>
                  <p className="text-[12px] text-gray-text">Visit Duration</p>
                </div>
              )}
            </div>
          </div>
          {activity.content && (
            <div className="w-[400px] rounded-lg bg-gray-light p-8">
              <span className="text-[11px] font-semibold tracking-[4px] text-gold">
                DETAILS
              </span>
              <div
                className="mt-4 text-[14px] leading-[1.8] text-gray-text [&_h1]:mb-2 [&_h1]:text-[18px] [&_h1]:font-semibold [&_h1]:text-green-dark [&_h2]:mb-2 [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:text-green-dark [&_h3]:mb-2 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-green-dark [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-3 [&_ul]:mb-3"
                dangerouslySetInnerHTML={{ __html: activity.content }}
              />
            </div>
          )}
        </div>
      </section>

      {/* Practical Info */}
      <section className="bg-gray-light px-20 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <span className="text-[11px] font-semibold tracking-[4px] text-gold">
              PLAN YOUR VISIT
            </span>
            <h2 className="mt-3 font-primary text-[38px] italic text-green-dark">
              Practical Information
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {activity.address && (
              <div className="rounded-xl bg-white p-8 shadow-sm">
                <span className="text-[11px] font-semibold tracking-[2px] text-gold">
                  ADDRESS
                </span>
                <p className="mt-3 text-[15px] leading-relaxed text-green-dark">
                  {activity.address}
                </p>
              </div>
            )}
            {activity.opening_hours && (
              <div className="rounded-xl bg-white p-8 shadow-sm">
                <span className="text-[11px] font-semibold tracking-[2px] text-gold">
                  OPENING HOURS
                </span>
                <p className="mt-3 text-[15px] leading-relaxed text-green-dark">
                  {activity.opening_hours}
                </p>
              </div>
            )}
            {activity.visit_duration && (
              <div className="rounded-xl bg-white p-8 shadow-sm">
                <span className="text-[11px] font-semibold tracking-[2px] text-gold">
                  VISIT DURATION
                </span>
                <p className="mt-3 text-[15px] leading-relaxed text-green-dark">
                  {activity.visit_duration}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#3D3530] px-20 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-white/50">
            READY TO EXPLORE
          </span>
          <h2 className="mt-4 font-primary text-[52px] italic leading-tight text-[#FAF5EF]">
            Your Concierge Awaits
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-white/60">
            Want to include this experience in your itinerary? Our dedicated
            travel specialists can arrange everything for you.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/concierge"
              className="rounded-full bg-white px-8 py-4 text-[13px] font-semibold text-green-dark transition-opacity hover:opacity-90"
            >
              Chat with Concierge
            </Link>
            <Link
              href="/more-dreams"
              className="rounded-full border border-white/30 px-8 py-4 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              Back to More Dreams
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
