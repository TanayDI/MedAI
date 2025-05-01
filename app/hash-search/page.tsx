"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, AlertTriangle, XCircle, Search, FileText, ArrowRight } from "lucide-react"
import Link from "next/link"
import { searchPrescriptionByHash } from "@/lib/actions"
import type { PrescriptionResult } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

export default function HashSearchPage() {
  const [searchHash, setSearchHash] = useState("")
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<PrescriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearching(true)
    setResult(null)
    setError(null)

    try {
      if (!searchHash.trim()) {
        throw new Error("Please enter a valid blockchain hash")
      }

      const prescription = await searchPrescriptionByHash(searchHash.trim())

      if (!prescription) {
        throw new Error("No prescription record found with this hash")
      }

      setResult(prescription)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setSearching(false)
    }
  }

  const getStatusIcon = (status: string) => {
    if (status === "valid") {
      return <CheckCircle className="h-6 w-6 text-green-500" />
    } else if (status === "warning") {
      return <AlertTriangle className="h-6 w-6 text-amber-500" />
    } else {
      return <XCircle className="h-6 w-6 text-red-500" />
    }
  }

  const getStatusColor = (status: string) => {
    if (status === "valid") {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    } else if (status === "warning") {
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
    } else {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    }
  }

  return (
    <div>
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
      <div className="container py-10 mx-auto max-w-3xl px-4 md:px-6">
        <div className="grid gap-6">
          <div className="flex flex-col items-center text-center gap-4">
            <h1 className="text-3xl font-bold">Blockchain Hash Search</h1>
            <p className="text-gray-500 max-w-lg">
              Enter a blockchain hash to retrieve the associated prescription analysis record from the Neo4j graph
              database
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search by Blockchain Hash</CardTitle>
              <CardDescription>Enter the blockchain hash to find the prescription record</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={searchHash}
                    onChange={(e) => setSearchHash(e.target.value)}
                    placeholder="Enter blockchain hash (e.g., a1b2c3d4)"
                    className="flex-1"
                  />
                  <Button type="submit" disabled={searching}>
                    {searching ? (
                      <>Searching</>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Prescription Record
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <Badge className={getStatusColor(result.status)}>
                    {result.status === "valid"
                      ? "Valid"
                      : result.status === "warning"
                        ? "Warnings Found"
                        : "Issues Detected"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Record ID</h3>
                    <p className="mt-1 font-mono text-sm">{result.id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Original Prescription</h3>
                    <p className="mt-1 whitespace-pre-line">{result.originalPrescription}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Medications</h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {result.medications?.map((med, index) => (
                        <Badge key={index} variant="outline">
                          {med}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {result.historyReference && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Relationship to Patient History
                      </h3>
                      <p className="mt-1">{result.historyReference}</p>
                    </div>
                  )}

                  {result.issues && result.issues.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Issues Found</h3>
                      <div className="mt-2 space-y-2">
                        {result.issues.map((issue, index) => (
                          <div key={index} className="p-3 border rounded-md">
                            <div className="flex items-center gap-2">
                              {issue.severity === "high" ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : issue.severity === "medium" ? (
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-blue-500" />
                              )}
                              <h4 className="font-medium">{issue.title}</h4>
                              <Badge
                                className={
                                  issue.severity === "high"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                    : issue.severity === "medium"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                }
                              >
                                {issue.severity}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{issue.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp</h3>
                    <p className="mt-1">{new Date(result.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</h3>
                    <p className="mt-1">{new Date(result.lastUpdated).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
