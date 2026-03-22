"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { useSetAtom } from "jotai";
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
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

declare global {
  interface Window {
    google: any;
  }
}

export default function SignUp() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [role, setRole] = useState<string>("");
  const setToken = useSetAtom(tokenAtom);
  const setUser = useSetAtom(userAtom);
  const router = useRouter();

  const { mutate } = useMutation({
    mutationFn: (credential: string) => googleSignIn(credential, role),
    onSuccess: (data) => {
      setToken(data.token);
      setUser(data.user);
      router.push("/dashboard");
    },
  });

  useEffect(() => {
    if (window.google) setScriptLoaded(true);
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: (response: { credential: string }) => {
        console.log("logged in");
        mutate(response.credential);
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      text: "signup_with",
    });
  }, [scriptLoaded, mutate, role]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">LakerTracks</CardTitle>
          <CardDescription>Create your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>I am a</Label>
            <div className="flex gap-4">
              <Button
                variant={role === "student" ? "default" : "outline"}
                className="flex-1 py-3"
                onClick={() => setRole("student")}
              >
                Student
              </Button>
              <Button
                variant={role === "instructor" ? "default" : "outline"}
                className="flex-1 py-3"
                onClick={() => setRole("instructor")}
              >
                Instructor
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <div ref={buttonRef} />
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>

      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
    </div>
  );
}
