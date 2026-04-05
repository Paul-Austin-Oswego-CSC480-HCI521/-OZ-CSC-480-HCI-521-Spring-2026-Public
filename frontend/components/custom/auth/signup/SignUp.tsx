"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useAtomValue, useSetAtom } from "jotai";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { tokenAtom, userAtom } from "@/components/custom/utils/context/state";
import { googleSignIn } from "@/components/custom/utils/api_utils/req/req";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { GraduationCap, ClipboardList, BookOpen, Users } from "lucide-react";
import { env } from "next-runtime-env";

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
      if (userInfo?.role == "instructor") router.push("/instructor");
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
    <div className="min-h-screen bg-linear-to-br from-green-600 via-green-800 via-60% to-green-600">
      <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 p-6 sm:p-10">
        {/* Branding */}
        <div className="text-center lg:text-left max-w-md space-y-6">
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">LakerTracks</h1>
              <p className="text-sm text-white/60">HCI 521 / CSC 480</p>
            </div>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight hidden lg:block">
            Track your progress.
            <br />
            <span className="text-emerald-300">Stay on course.</span>
          </h2>

          <div className="hidden lg:flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <ClipboardList className="h-4 w-4 text-emerald-300" />
              </div>
              <p className="text-sm text-white/80">
                Submit and track weekly work logs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4 text-emerald-300" />
              </div>
              <p className="text-sm text-white/80">
                Manage tasks and deadlines
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-emerald-300" />
              </div>
              <p className="text-sm text-white/80">
                Collaborate with your team
              </p>
            </div>
          </div>
        </div>

        {/* Sign in card */}
        <Card className="w-full max-w-sm shadow-xl text-3xl">
          <CardHeader className="text-center space-y-2 pb-2">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>
              Sign in with your SUNY Oswego account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="flex justify-center">
              <div ref={buttonRef} />
            </div>

            {isError && (
              <p className="text-sm text-destructive text-center">
                Sign in failed. Please try again.
              </p>
            )}

            <p className="text-xs text-center text-muted-foreground">
              Use your @oswego.edu Google account to continue.
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="absolute bottom-4 left-0 right-0 text-xs text-center text-white/40">
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
