"use client";
import { Check } from "@mui/icons-material";

export default function InputMethod({
  label,
  selected,
  action,
  disabled,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  action: () => void;
}) {
  return (
    <div
      role="button"
      onClick={action}
      className={`${
        disabled ? "bg-gray-100 last-of-type:border-gray-400 cursor-not-allowed" : selected ? "bg-red-100" : "bg-white hover:bg-red-50 last-of-type:border-primary"
      }  gap-2 overflow-hidden whitespace-nowrap font-medium px-4 py-1 w-1/2 flex justify-center items-center last-of-type:border-l`}
    >
      {selected && <Check />}
      <span className="overflow-hidden overflow-ellipsis">{label}</span>
    </div>
  );
}
