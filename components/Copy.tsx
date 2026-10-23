"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import toast from "react-hot-toast";

const Copy = ({ title }: { title: string }) => {
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(title);
      setHasCopied(true);
      toast.success("Account details copied!");

      setTimeout(() => {
        setHasCopied(false);
      }, 2000);
    } catch {
      toast.error("Could not copy account details.");
    }
  };

  const shortTitle =
    title.length > 14 ? `${title.slice(0, 10)}...${title.slice(-5)}` : title;

  return (
    <Button
      type="button"
      data-state="closed"
      className="flex h-7 min-w-0 max-w-full items-center justify-center gap-6 px-2 py-1"
      variant="secondary"
      onClick={copyToClipboard}
      title="Copy full shareable ID"
    >
      <span className="min-w-0 truncate text-xs font-medium leading-none text-black-2 ">
        {shortTitle}
      </span>

      {hasCopied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 shrink-0"
          aria-label="Copied"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 shrink-0"
          aria-label="Copy"
        >
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
      )}
    </Button>
  );
};

export default Copy;
