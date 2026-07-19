"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface EnrollTrackContextValue {
  selectedTrack: string;
  setSelectedTrack: (track: string) => void;
}

const EnrollTrackContext = createContext<EnrollTrackContextValue | null>(null);

export function EnrollTrackProvider({ children }: { children: ReactNode }) {
  const [selectedTrack, setSelectedTrack] = useState("");
  return <EnrollTrackContext.Provider value={{ selectedTrack, setSelectedTrack }}>{children}</EnrollTrackContext.Provider>;
}

export function useEnrollTrack(): EnrollTrackContextValue {
  const ctx = useContext(EnrollTrackContext);
  if (!ctx) throw new Error("useEnrollTrack must be used within EnrollTrackProvider");
  return ctx;
}
