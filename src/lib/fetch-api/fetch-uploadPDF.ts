const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
import { fetchRequest } from "./utils";

type FetchGetCoursesResponse = {
  data: {
    id: string;
    discipline_id: string | null;
    course_id: string | null;
    mandatory: boolean | null;
    period: number | null;
    created_at: Date | null;
  }[];
};

function createFormData(file: File, courseId: string) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("courseId", courseId);

  return formData;
}

export async function postUploadPDF({ file, courseId }: { file: File; courseId: string }) {
  try {
    const formData = createFormData(file, courseId);
    const res = await fetchRequest<FetchGetCoursesResponse>(`${API_BASE_URL}/uploadPDF`, { method: "POST", body: formData });

    if (!res.data) {
      throw new Error("Failed to fetch data");
    }

    return res.data;
  } catch (error) {
    return [];
  }
}