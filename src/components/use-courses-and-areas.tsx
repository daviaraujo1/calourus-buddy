import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CourseOption = { id: string; name: string; active: boolean };
export type AreaOption = { id: string; course_id: string; name: string };

export function useCoursesAndAreas() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [areas, setAreas] = useState<AreaOption[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: a }] = await Promise.all([
        supabase.from("courses").select("id, name, active").order("sort_order"),
        supabase.from("subject_areas").select("id, course_id, name").order("sort_order"),
      ]);
      setCourses(c ?? []);
      setAreas(a ?? []);
    })();
  }, []);

  return { courses, areas };
}
