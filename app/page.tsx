import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "MedVerify - AI Prescription Checker",
  description: "Verify your prescriptions with AI-powered analysis",
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 container mx-auto max-w-8xl px-4 md:px-6">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl">MedVerify</span>
            </Link>
          </div>
          <nav className="flex flex-1 items-center justify-end space-x-4">
            <Link href="/about">
              <Button variant="ghost">About</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/register">
              <Button>
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-100 dark:from-gray-950 dark:to-gray-900">
          <div className="container mx-auto max-w-6xl px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  AI-Powered Prescription Verification
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our advanced AI system analyzes your prescriptions for
                  potential issues, drug interactions, and dosage errors,
                  providing you with peace of mind.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button size="lg">
                      Check Your Prescription
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button size="lg" variant="outline">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[500px] aspect-square">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg opacity-20 blur-xl"></div>
                  <div className="relative bg-white dark:bg-gray-900 border rounded-lg shadow-lg p-6 h-full">
                    <div className="space-y-4">
                      <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                        <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded"></div>
                        <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-800 rounded"></div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <div className="h-6 w-6 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
                        </div>
                      </div>
                      <div className="h-24 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                      <div className="h-10 w-1/3 bg-blue-500 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto max-w-6xl px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  How It Works
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our system combines advanced AI with medical databases to
                  provide accurate prescription analysis
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <div className="h-8 w-8 text-blue-500">1</div>
                </div>
                <h3 className="text-xl font-bold">Register & Input</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Enter your information, symptoms, and prescription details in
                  our secure form
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <div className="h-8 w-8 text-blue-500">2</div>
                </div>
                <h3 className="text-xl font-bold">AI Analysis</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Our AI system analyzes your prescription using medical
                  databases and online resources
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <div className="h-8 w-8 text-blue-500">3</div>
                </div>
                <h3 className="text-xl font-bold">Secure Results</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  View your results and securely store them on the blockchain
                  for future reference
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-gray-500 md:text-left">
            © 2025 MedVerify. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/terms"
              className="text-sm text-gray-500 underline-offset-4 hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-gray-500 underline-offset-4 hover:underline"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
