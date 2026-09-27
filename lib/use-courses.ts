"use client";

import { useCallback, useEffect, useState } from "react";
import { enrichCoursePageCounts, getCourses, type StoredCourse } from "@/lib/local-courses";

export function useCourses() {
  const [courses, setCourses] = useState<StoredCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const stored = await getCourses();
      const enriched = await Promise.all(stored.map((course) => enrichCoursePageCounts(course)));
      setCourses(enriched);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { courses, setCourses, isLoading, reload };
}
