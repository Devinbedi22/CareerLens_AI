"use client";

import { useState } from "react";
import HeroSection from "@/components/hero";
import RoadmapSection from "@/components/sections/roadmap";
import { DEFAULT_CAREER_PATH } from "@/data/career-paths";

export default function CareerRoadmapExperience() {
  const [selectedPath, setSelectedPath] = useState(DEFAULT_CAREER_PATH);

  return (
    <>
      <HeroSection selectedPath={selectedPath} onSelectedPathChange={setSelectedPath} />
      <RoadmapSection selectedPath={selectedPath} />
    </>
  );
}