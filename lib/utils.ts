/* eslint-disable no-prototype-builtins */
import { type ClassValue, clsx } from "clsx";
import qs from "query-string";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDateTime = (dateString: Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };

  const dateDayOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    year: "numeric",
    day: "numeric",
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };

  const formattedDateTime: string = new Date(dateString).toLocaleString(
    "en-US",
    dateTimeOptions,
  );
  const formattedDateDay: string = new Date(dateString).toLocaleString(
    "en-US",
    dateDayOptions,
  );
  const formattedDate: string = new Date(dateString).toLocaleString(
    "en-US",
    dateOptions,
  );
  const formattedTime: string = new Date(dateString).toLocaleString(
    "en-US",
    timeOptions,
  );

  return {
    dateTime: formattedDateTime,
    dateDay: formattedDateDay,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  };
};

export function formatAmount(amount: number): string {
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN", // changed from USD to NGN
    minimumFractionDigits: 2,
  });

  return formatter.format(amount);
}

export const parseStringify = (value: any) => JSON.parse(JSON.stringify(value));

export const removeSpecialCharacters = (value: string) => {
  return value.replace(/[^\w\s]/gi, "");
};

interface UrlQueryParams {
  params: string;
  key: string;
  value: string;
}

export function formUrlQuery({ params, key, value }: UrlQueryParams) {
  const currentUrl = qs.parse(params);

  currentUrl[key] = value;

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentUrl,
    },
    { skipNull: true },
  );
}

export function getAccountTypeColors(type: AccountTypes) {
  switch (type) {
    case "depository":
      return {
        bg: "bg-blue-25",
        lightBg: "bg-blue-100",
        title: "text-blue-900",
        subText: "text-blue-700",
      };
    case "credit":
      return {
        bg: "bg-success-25",
        lightBg: "bg-success-100",
        title: "text-success-900",
        subText: "text-success-700",
      };
    default:
      return {
        bg: "bg-green-25",
        lightBg: "bg-green-100",
        title: "text-green-900",
        subText: "text-green-700",
      };
  }
}

export function countTransactionCategories(
  transactions: Transaction[],
): CategoryCount[] {
  const categoryCounts: { [category: string]: number } = {};
  let totalCount = 0;

  transactions &&
    transactions.forEach((transaction) => {
      const category = transaction.category;
      if (categoryCounts.hasOwnProperty(category)) {
        categoryCounts[category]++;
      } else {
        categoryCounts[category] = 1;
      }
      totalCount++;
    });

  const aggregatedCategories: CategoryCount[] = Object.keys(categoryCounts).map(
    (category) => ({
      name: category,
      count: categoryCounts[category],
      totalCount,
    }),
  );

  aggregatedCategories.sort((a, b) => b.count - a.count);

  return aggregatedCategories;
}

export function extractCustomerIdFromUrl(url: string) {
  const parts = url.split("/");
  const customerId = parts[parts.length - 1];
  return customerId;
}

export function encryptId(id: string) {
  return btoa(id);
}

export function decryptId(id: string) {
  return atob(id);
}

export const getTransactionStatus = (date: Date) => {
  const today = new Date();
  const thirtySecsAgo = new Date(today);
  thirtySecsAgo.setSeconds(today.getSeconds() - 40);

  return date > thirtySecsAgo ? "Processing" : "Success";
};

export const FormSchema = (type: string) =>
  z.object({
    // 👤 Personal Info Fields
    firstName:
      type === "sign-in"
        ? z.string().optional()
        : z
            .string()
            .min(3, { message: "First name must be at least 3 characters." }),

    lastName:
      type === "sign-in"
        ? z.string().optional()
        : z
            .string()
            .min(3, { message: "Last name must be at least 3 characters." }),

    // 🏠 Address Fields
    address1:
      type === "sign-in"
        ? z.string().optional()
        : z
            .string()
            .max(50, { message: "Address cannot exceed 50 characters." }),

    city:
      type === "sign-in"
        ? z.string().optional()
        : z
            .string()
            .max(50, { message: "City name cannot exceed 50 characters." }),

    state:
      type === "sign-in"
        ? z.string().optional()
        : z
            .string()
            .min(2, { message: "Use 2-letter code." })
            .max(2, { message: "Use 2-letter code." }),

    postalCode:
      type === "sign-in"
        ? z.string().optional()
        : z
            .string()
            .min(3, { message: "Invalid postal code." })
            .max(6, { message: "Invalid postal code." }),

    // 📅 Identification Fields
    dateOfBirth:
      type === "sign-in"
        ? z.string().optional()
        : z.string().min(3, { message: "Please enter your date of birth." }),

    ssn:
      type === "sign-in"
        ? z.string().optional()
        : z.string().min(3, { message: "SSN must be at least 3 characters." }),

    // 🔑 Credentials (Active on BOTH tracks)
    email: z.string().email({ message: "Please enter a valid email address." }),

    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long." }), // 🚩 Synced with Appwrite
  });

// /constants/categories.ts

export const demoCategoriesWithTotal = () => {
  const data = [
    { name: "Food", count: 12 },
    { name: "Transport", count: 8 },
    { name: "Bills", count: 5 },
    { name: "Entertainment", count: 3 },
  ];

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return data.map((item) => ({
    ...item,
    totalCount: total,
  }));
};
