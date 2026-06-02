"use client";

import React, { useState } from "react";
import { getAllProfiles, DIFFICULTY_SETTINGS, DURATION_OPTIONS } from "@/lib/voice-interview-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function CompanyDifficultySelector({ onStart, isLoading }) {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [difficulty, setDifficulty] = useState("Medium");
  const [duration, setDuration] = useState(30);

  const profiles = getAllProfiles();

  const handleStart = () => {
    if (!selectedCompany) {
      return;
    }
    onStart(selectedCompany.id, difficulty, duration);
  };

  return (
    <div className="space-y-8 py-6">
      {/* Company Selection */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Select an Interviewer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <Card
              key={profile.id}
              className={`cursor-pointer transition-all ${
                selectedCompany?.id === profile.id
                  ? "border-blue-500 bg-blue-50 border-2"
                  : "hover:border-gray-400"
              }`}
              onClick={() => setSelectedCompany(profile)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{profile.name}</CardTitle>
                <CardDescription className="text-xs">{profile.category}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Focus Areas:</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.focusAreas.slice(0, 3).map((area) => (
                      <Badge key={area} variant="outline" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="font-medium">Technical</p>
                    <p>{profile.technicalWeight}%</p>
                  </div>
                  <div>
                    <p className="font-medium">Behavioral</p>
                    <p>{profile.behavioralWeight}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Difficulty Selection */}
      <div className="max-w-md">
        <h3 className="text-xl font-bold mb-4">Interview Difficulty</h3>
        <RadioGroup value={difficulty} onValueChange={setDifficulty} className="space-y-3">
          {Object.values(DIFFICULTY_SETTINGS).map((setting) => (
            <div key={setting.level} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value={setting.level} id={`difficulty-${setting.level}`} />
              <Label htmlFor={`difficulty-${setting.level}`} className="flex-1 cursor-pointer">
                <p className="font-medium">{setting.level}</p>
                <p className="text-sm text-muted-foreground">{setting.questionComplexity}</p>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Duration Selection */}
      <div className="max-w-md">
        <h3 className="text-xl font-bold mb-4">Interview Duration</h3>
        <RadioGroup
          value={duration.toString()}
          onValueChange={(val) => setDuration(parseInt(val))}
          className="space-y-3"
        >
          {DURATION_OPTIONS.map((min) => (
            <div key={min} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value={min.toString()} id={`duration-${min}`} />
              <Label htmlFor={`duration-${min}`} className="flex-1 cursor-pointer">
                <p className="font-medium">{min} minutes</p>
                <p className="text-sm text-muted-foreground">
                  ~{Math.ceil((min / 5))} questions
                </p>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Start Button */}
      <Button
        onClick={handleStart}
        disabled={!selectedCompany || isLoading}
        size="lg"
        className="w-full sm:w-auto"
      >
        {isLoading ? "Starting Interview..." : "Start Interview"}
      </Button>
    </div>
  );
}
