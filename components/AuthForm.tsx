"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "./ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

import CustomInput from "./CustomInput";
import { FormSchema } from "@/lib/utils";
import { signIn, signUp } from "@/lib/actions/user.actions";
import MonoLink from "./MonoLink";
import toast from "react-hot-toast";

const AuthForm = ({ type }: { type: string }) => {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();

  const authFormSchema = FormSchema(type);

  const form = useForm<z.infer<typeof authFormSchema>>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      address1: "",
      city: "",
      state: "",
      postalCode: "",
      dateOfBirth: "",
      ssn: "",
    },
  });
  const onSubmit = async (data: z.infer<typeof authFormSchema>) => {
    if (isPending) return;
    form.clearErrors();

    startTransition(async () => {
      try {
        if (type === "sign-up") {
          const userData = {
            firstName: data.firstName!,
            lastName: data.lastName!,
            address1: data.address1!,
            city: data.city!,
            state: data.state!,
            postalCode: data.postalCode!,
            dateOfBirth: data.dateOfBirth!,
            ssn: data.ssn!,
            email: data.email,
            password: data.password,
          };

          const newUser = await signUp(userData);

          // A successful sign-up must return the created database user.
          if (newUser && newUser.$id) {
            setUser(newUser);

            toast.success(
              "Account created successfully! Now link your bank account to get started.",
              { duration: 4000 },
            );
          } else {
            form.setError("root", {
              type: "manual",
              message: "Account creation failed. Please try again.",
            });

            toast.error("Unable to create your account. Please try again.", {
              duration: 4000,
            });
          }
        } else if (type === "sign-in") {
          const response = await signIn({
            email: data.email,
            password: data.password,
          });

          // Appwrite sessions contain both an ID and a user ID.
          // Do not use !response.message as the success check.
          if (response?.$id && response?.userId) {
            router.refresh();
            router.push("/?success=true");
          } else {
            form.setError("root", {
              type: "manual",
              message: "Unable to sign in. Please try again.",
            });

            toast.error("Unable to sign in. Please try again.", {
              duration: 4000,
            });
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message.toLowerCase() : "";

        console.error("Authentication failed:", error);

        const isNetworkError =
          /fetch failed|failed to fetch|network error|network request failed|econnrefused|econnreset|enotfound|etimedout|und_err|socket hang up|connect timeout|networkerror|timed out/.test(
            errorMessage,
          );

        if (isNetworkError) {
          const message =
            "Connection problem. Check your internet connection and try again.";

          form.setError("root", {
            type: "manual",
            message,
          });

          toast.error(message, { duration: 4000 });
          return;
        }

        if (type === "sign-up") {
          if (
            errorMessage.includes("already exists") ||
            errorMessage.includes("user_already_exists")
          ) {
            const message =
              "This email or phone number is already registered. Try signing in instead.";

            form.setError("email", {
              type: "manual",
              message,
            });

            toast.error(message, { duration: 4000 });
          } else {
            form.setError("root", {
              type: "manual",
              message:
                "Account creation failed. Please check your details and try again.",
            });

            toast.error("Unable to create your account. Please try again.", {
              duration: 4000,
            });
          }
        } else {
          // For sign-in, invalid credentials should not be shown
          // as a registration or password-policy error.
          const message = isNetworkError
            ? "Connection problem. Check your internet connection and try again."
            : "The email or password you entered is incorrect.";

          form.setError("root", {
            type: "manual",
            message,
          });

          toast.error(message, { duration: 4000 });
        }
      }
    });
  };
  return (
    <section className="auth-form">
      <Card className="w-full sm:max-w-md !ring-0 focus:!ring-0 focus-visible:!ring-0 focus:outline-none">
        <CardHeader>
          <CardTitle>
            <Link
              href="/"
              className="mb-4 flex cursor-pointer items-center gap-1"
            >
              <Image
                src="/icons/logo.svg"
                width={34}
                height={34}
                alt="HavenTrust logo"
              />

              <span className="text-26 font-ibm-plex-serif font-bold text-black-1">
                HavenTrust
              </span>
            </Link>
          </CardTitle>

          <CardDescription>
            <div className="flex flex-col gap-1 py-8 md:gap-3">
              <h1 className="text-20 font-semibold text-gray-900 lg:text-36">
                {user
                  ? "Link Account"
                  : type === "sign-in"
                    ? "Sign In"
                    : "Sign Up"}
              </h1>

              <p className="text-16 font-normal text-gray-600">
                {user
                  ? "Link your account to get started"
                  : "Please enter your details"}
              </p>
            </div>
          </CardDescription>
        </CardHeader>

        {user ? (
          <CardContent className="pb-4">
            <div className="flex flex-col gap-4">
              <MonoLink user={user} variant="primary" />
            </div>
          </CardContent>
        ) : (
          <form
            id="form-rhf-demo"
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.error("Form validation errors:", errors);
            })}
          >
            <fieldset disabled={isPending} className="m-0 min-w-0 border-0 p-0">
              <CardContent className="pb-4">
                <FieldGroup>
                  {type === "sign-up" && (
                    <>
                      <div className="flex gap-4">
                        <CustomInput
                          control={form.control}
                          name="firstName"
                          label="First Name"
                          placeholder="Enter your first name"
                        />

                        <CustomInput
                          control={form.control}
                          name="lastName"
                          label="Last Name"
                          placeholder="Enter your last name"
                        />
                      </div>

                      <CustomInput
                        control={form.control}
                        name="address1"
                        label="Address"
                        placeholder="Enter your specific address"
                      />

                      <CustomInput
                        control={form.control}
                        name="city"
                        label="City"
                        placeholder="Enter your city"
                      />

                      <div className="flex gap-4">
                        <CustomInput
                          control={form.control}
                          name="state"
                          label="State"
                          placeholder="Example: LA"
                        />

                        <CustomInput
                          control={form.control}
                          name="postalCode"
                          label="Postal Code"
                          placeholder="Example: 111011"
                        />
                      </div>

                      <div className="flex gap-4">
                        <CustomInput
                          control={form.control}
                          name="dateOfBirth"
                          label="Date of Birth"
                          placeholder="YYYY-MM-DD"
                        />

                        <CustomInput
                          control={form.control}
                          name="ssn"
                          label="SSN"
                          placeholder="Example: 1234"
                        />
                      </div>
                    </>
                  )}

                  <CustomInput
                    control={form.control}
                    name="email"
                    label="Email"
                    placeholder="Enter your email"
                  />

                  <CustomInput
                    control={form.control}
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                  />
                </FieldGroup>

                {form.formState.errors.root && (
                  <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
                    {form.formState.errors.root.message}
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Field orientation="horizontal">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    className="form-btn flex-1"
                    disabled={isPending}
                  >
                    Reset
                  </Button>

                  <Button
                    type="submit"
                    className="form-btn flex-1"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Loading...
                      </>
                    ) : type === "sign-in" ? (
                      "Sign In"
                    ) : (
                      "Sign Up"
                    )}
                  </Button>
                </Field>
              </CardFooter>
            </fieldset>

            <footer className="flex justify-center gap-1 pb-4">
              <p className="text-14 font-normal text-gray-600">
                {type === "sign-in"
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </p>

              <Link
                href={type === "sign-in" ? "/sign-up" : "/sign-in"}
                className="form-link"
              >
                {type === "sign-in" ? "Sign Up" : "Sign In"}
              </Link>
            </footer>
          </form>
        )}
      </Card>
    </section>
  );
};

export default AuthForm;
