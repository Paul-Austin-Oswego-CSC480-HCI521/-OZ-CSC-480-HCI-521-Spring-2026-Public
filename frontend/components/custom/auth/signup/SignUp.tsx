"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import { useAtomValue, useSetAtom } from "jotai";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  isInstructorRole,
  tokenAtom,
  userAtom,
} from "@/components/custom/utils/context/state";
import { googleSignIn } from "@/components/custom/utils/api_utils/req/req";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import { env } from "next-runtime-env";

const BRAND_GREEN = "#1E4B35";

declare global {
  interface Window {
    google: any;
  }
}

export default function SignUp() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const setToken = useSetAtom(tokenAtom);
  const userInfo = useAtomValue(userAtom);
  const router = useRouter();

  const { mutate, isError } = useMutation({
    mutationFn: (credential: string) => googleSignIn(credential, "student"),
    onSuccess: (data) => {
      setToken(data.token);
      document.cookie = `token=${data.token}; path=/;`;
      if (isInstructorRole(userInfo?.role)) router.push("/instructor");
      router.push("/");
    },
  });

  useEffect(() => {
    if (window.google) setScriptLoaded(true);
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !window.google || !buttonRef.current) return;
    window.google.accounts.id.initialize({
      client_id: env("NEXT_PUBLIC_GOOGLE_CLIENT_ID")!,
      callback: (response: { credential: string }) => {
        mutate(response.credential);
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
    });
  }, [scriptLoaded, mutate]);

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 p-6 sm:p-10">
        {/* Branding */}
        <div className="text-center lg:text-left max-w-md space-y-6">
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <Image
              src="/lakerlog.svg"
              alt="LakerLogs logo"
              width={56}
              height={56}
              priority
              className="shrink-0"
            />
            <div>
              <h1
                className="text-3xl font-bold"
                style={{ color: BRAND_GREEN }}
              >
                LakerLogs
              </h1>
              <p className="text-sm text-muted-foreground">
                HCI 521 / CSC 480
              </p>
            </div>
          </div>

          <h2
            className="text-3xl lg:text-4xl font-bold leading-tight hidden lg:block"
            style={{ color: BRAND_GREEN }}
          >
            Track your progress.
            <br />
            <span className="text-amber-500">Stay on course.</span>
          </h2>

          <div className="hidden lg:flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <ClipboardList
                className="h-5 w-5 shrink-0"
                style={{ color: BRAND_GREEN }}
              />
              <p className="text-sm text-zinc-700">
                Submit and track weekly work logs
              </p>
            </div>
          </div>
        </div>

        {/* Sign in card */}
        <Card
          className="w-full max-w-sm shadow-xl border-0 text-white"
          style={{ backgroundColor: BRAND_GREEN }}
        >
          <CardHeader className="text-center space-y-2 pb-2">
            <CardTitle className="text-2xl text-white">Welcome</CardTitle>
            <CardDescription className="text-white/80">
              Sign in with your SUNY Oswego account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="flex justify-center">
              <div ref={buttonRef} />
            </div>

            {isError && (
              <p className="text-sm text-red-300 text-center">
                Sign in failed. Please try again.
              </p>
            )}

            <p className="text-xs text-center text-white/70">
              Use your @oswego.edu Google account to continue.
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="absolute bottom-4 left-0 right-0 text-xs text-center text-muted-foreground">
        SUNY Oswego · Department of Computer Science
      </p>

      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
    </div>
  );
}
