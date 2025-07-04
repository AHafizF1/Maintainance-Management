"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link"; // Import Link
import { authClient } from "@/lib/auth-client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Added for sign-up
  const router = useRouter();

  // Use the useAuth hook from authClient
  const { signUp, signInWithProvider, isLoading, error } = authClient.useAuth();

  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setFormError("All fields are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    // Password strength (example: min 8 chars) - better-auth might handle this server-side too
    // Based on lib/auth-client.ts, usernameClient has password validation rules.
    // We can rely on server-side validation from better-auth for strength,
    // but a client-side check for length is good UX.
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    try {
      await signUp("password", {
        // Using 'password' as the provider for email/password via usernameClient
        email,
        password,
        // name: email.split('@')[0], // better-auth might handle name creation or it can be added
        onSuccess: () => {
          router.push("/"); // Redirect to home or a verification page after successful sign-up
          router.refresh();
        },
        // onError is implicitly handled by the `error` state from `useAuth()`
        // but we can set formError for more specific messages if needed.
      });
      // If signUp itself throws an error not caught by the hook's 'error' state by default
      // (e.g. network issue before request is made, or if better-auth client doesn't set hook error for all cases)
      // This is less likely with better-auth/react hooks but good to be aware
    } catch (err: any) {
      // This catch block might be redundant if useAuth's error state captures all sign-up errors.
      // It's here as a fallback.
      console.error("Sign up submission error:", err);
      setFormError(err.message || "An unexpected error occurred during sign up.");
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    await signInWithProvider("google", {
      onSuccess: () => {
        router.push("/");
        router.refresh();
      },
      onError: (err: any) => {
        console.error("Google sign in error:", err);
        setFormError(err.message || "An unexpected error occurred with Google Sign-In.");
      },
    });
  };

  return (
    <div className="relative min-h-screen w-full">
      <div className="fixed inset-0 z-0 overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`absolute h-full w-1/12 -skew-x-12 transform bg-primary/5 dark:bg-primary/10 ${
              i % 2 === 0 ? "animate-stripe-slow" : "animate-stripe-fast"
            }`}
            style={{ left: `${i * 10 - 20}%`, animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:flex-row">
        <div className="flex w-full flex-col items-center p-4 md:w-1/3 md:items-start md:p-8">
          <div className="p-6">
            <Image src="/Logo1.svg" alt="App Logo" width={300} height={300} className="dark:invert" priority />
          </div>
        </div>

        <div className="flex w-full items-center justify-center p-4 md:flex-1 md:p-8">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border/20 bg-black/90 p-8 shadow-2xl backdrop-blur-sm">
            <div className="pb-6 text-center md:text-left">
              <h2 className="mb-8 text-3xl font-bold text-white">Sign Up</h2> {/* Changed title */}
              {(error || formError) && ( // Display general hook error or specific form error
                <div className="mb-4 w-full rounded-lg bg-red-100 p-4 text-sm text-red-700" role="alert">
                  {formError || error?.message || "An unexpected error occurred."}
                </div>
              )}
              <form onSubmit={handleSubmit} className="mb-6 space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-white placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-white placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  {" "}
                  {/* Added Confirm Password field */}
                  <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-300">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-white placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-primary/50"
                    placeholder="Confirm your password"
                    required
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing up..." : "Sign Up"} {/* Changed button text */}
                </button>
              </form>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-black/90 px-2 text-gray-400">Or continue with</span>
                </div>
              </div>
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-center text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="mr-2 h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {isLoading ? "Redirecting..." : "Sign up with Google"} {/* Changed button text */}
              </button>
              <p className="mt-6 text-center text-xs text-gray-400">
                By signing up, you agree to our Terms of Service and Privacy Policy. {/* Changed text */}
              </p>
              <p className="mt-4 text-center text-sm text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes stripe-slow {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(100%) skewX(-12deg);
          }
        }
        @keyframes stripe-fast {
          0% {
            transform: translateX(-150%) skewX(-12deg);
          }
          100% {
            transform: translateX(150%) skewX(-12deg);
          }
        }
        .animate-stripe-slow {
          animation: stripe-slow 20s linear infinite;
        }
        .animate-stripe-fast {
          animation: stripe-fast 15s linear infinite;
        }
      `}</style>
    </div>
  );
}
