const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
import { Discipline } from "@prisma/client";
import { fetchRequest } from "./utils";

type FetchUploadPDFResponse = {
  data: Discipline[];
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
    const res = await fetchRequest<FetchUploadPDFResponse>(`${API_BASE_URL}/uploadPDF`, { method: "POST", body: formData });

    if (!res.data) {
      throw new Error("Failed to fetch data");
    }

    return res.data;
  } catch (error) {
    return [];
  }
}
