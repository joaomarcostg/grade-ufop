"use client";
import { FormEvent, useContext, useRef, useState } from "react";
import { UploadFile, Delete, InsertDriveFileOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { StudentContext } from "@/app/context/StudentContext";
import { ActionType } from "@/app/context/actions";
import { postUploadPDF } from "@/lib/fetch-api/fetch-uploadPDF";
import LinearLoadingBar from "./LinearLoadingBar";
import { getErrorMessage } from "@/app/utils/error";

export default function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    state: { course },
    dispatch,
  } = useContext(StudentContext);

  function getFile(event: FormEvent<HTMLInputElement>) {
    const target = event.target as HTMLInputElement & {
      files: FileList;
    };

    if (!target.files.length) {
      return null;
    }

    if (target.files[0].type !== "application/pdf") {
      return null;
    }

    return target.files[0];
  }

  function handleRemoveFile() {
    if (inputRef.current?.value) {
      inputRef.current.value = "";
    }

    setFile(null);
  }

  async function handleChange(event: FormEvent<HTMLInputElement>) {
    try {
      const uploadedFile = getFile(event);

      if (!uploadedFile) {
        throw new Error("Arquivo inválido");
      }

      if (!course?.value) {
        throw new Error("Curso não selecionado");
      }

      setFile(uploadedFile);
      setLoading(true);

      const coursedDisciplines = await postUploadPDF({ file: uploadedFile, courseId: course.value });
      dispatch({ type: ActionType.SET_MULTIPLE_COURSED_DISCIPLINES, payload: coursedDisciplines });
      
      setErrorMsg("");
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="relative w-[600px] border-dashed border border-gray-400 py-6 flex flex-col gap-2 justify-center items-center rounded">
        <UploadFile color={"primary"} fontSize="large" />
        <div>
          <span className="underline text-primary cursor-pointer">Clique para upload</span>
          <span> ou arraste e solte o arquivo aqui</span>
        </div>
        <input
          className="absolute w-full h-full cursor-pointer opacity-0"
          ref={inputRef}
          type="file"
          onChange={handleChange}
          accept=".pdf"
        />
      </div>
      {loading && <LinearLoadingBar />}
      {file && (
        <div className="flex w-full gap-4 p-4 items-center">
          <div>
            <InsertDriveFileOutlined color={"primary"} fontSize="large" />
          </div>
          <div className="flex flex-col flex-1">
            <span>{file.name}</span>
            <span>{Math.round(file.size / 1000)} Kb</span>
          </div>
          <div className=" text-gray-500">
            <IconButton onClick={() => handleRemoveFile()}>
              <Delete color="inherit" fontSize="medium" />
            </IconButton>
          </div>
        </div>
      )}
      {errorMsg && <div className="text-red-600 p-2">{errorMsg}</div>}
    </div>
  );
}
