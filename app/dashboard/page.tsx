"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  User,
  Pill,
  Database,
  RefreshCw,
  Download,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPrescriptionResults, updateBlockchainRecord } from "@/lib/actions";
import type { PrescriptionResult } from "@/lib/types";

export default function DashboardPage() {
  const [results, setResults] = useState<PrescriptionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user info from session storage
        const storedFormData = sessionStorage.getItem("formData");
        if (storedFormData) {
          setUserInfo(JSON.parse(storedFormData));
        }

        // Get results from server
        const data = await getPrescriptionResults();
        setResults(data);
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpdateRecord = async () => {
    if (!results) return;

    setUpdating(true);
    try {
      await updateBlockchainRecord(results.id);
      alert("Record updated successfully on the blockchain!");
    } catch (error) {
      console.error("Error updating record:", error);
      alert("Failed to update record. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 md:px-6 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-lg">Loading your prescription analysis...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="container mx-auto max-w-6xl px-4 md:px-6 py-10">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            We couldn't retrieve your prescription analysis results. Please try
            again or contact support.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push("/register")}>
            Return to Registration
          </Button>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (results.status === "valid") {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    } else if (results.status === "warning") {
      return <AlertTriangle className="h-6 w-6 text-amber-500" />;
    } else {
      return <XCircle className="h-6 w-6 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    if (results.status === "valid") {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    } else if (results.status === "warning") {
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
    } else {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    }
  };

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
      <div className="container py-10 container mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">
              Prescription Analysis Results
            </h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userInfo ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Name
                        </p>
                        <p>{userInfo.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Age
                        </p>
                        <p>{userInfo.age}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Gender
                        </p>
                        <p className="capitalize">{userInfo.gender}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Current Medications
                        </p>
                        <p>{userInfo.medications}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Symptoms
                      </p>
                      <p className="text-sm">{userInfo.symptoms}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">
                    Patient information not available
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Prescription Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Original Prescription
                    </p>
                    <p className="text-sm whitespace-pre-line">
                      {userInfo?.prescription || results.originalPrescription}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Analysis Status
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon()}
                      <Badge className={getStatusColor()}>
                        {results.status === "valid"
                          ? "Valid"
                          : results.status === "warning"
                            ? "Warnings Found"
                            : "Issues Detected"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Blockchain Record ID
                    </p>
                    <p className="text-sm font-mono">{results.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="analysis">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
            </TabsList>
            <TabsContent value="analysis" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Prescription Analysis</CardTitle>
                  <CardDescription>
                    Detailed analysis of your prescription by our AI system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.status !== "valid" &&
                  results.issues &&
                  results.issues.length > 0 ? (
                    <div className="space-y-4">
                      {results.issues.map((issue, index) => (
                        <Alert
                          key={index}
                          variant={
                            issue.severity === "high"
                              ? "destructive"
                              : "default"
                          }
                        >
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>{issue.title}</AlertTitle>
                          <AlertDescription>
                            {issue.description}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>No Issues Detected</AlertTitle>
                      <AlertDescription>
                        Our AI analysis found no issues with your prescription.
                        It appears to be valid and appropriate.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="suggestions" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>
                    AI-generated suggestions based on your prescription and
                    symptoms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.suggestions && results.suggestions.length > 0 ? (
                      results.suggestions.map((suggestion, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <h3 className="font-medium flex items-center gap-2">
                            <Pill className="h-4 w-4 text-blue-500" />
                            {suggestion.title}
                          </h3>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {suggestion.description}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">
                        No specific recommendations at this time.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="data-sources" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Data Sources</CardTitle>
                  <CardDescription>
                    Information about the data sources used in the analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-500" />
                        Vector Database
                      </h3>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Our system accessed a comprehensive vector database
                        containing information on{" "}
                        {results.dataSources?.vectorDbEntries || "N/A"}{" "}
                        medications, including dosages, interactions, and
                        contraindications.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-500" />
                        Online Search Results
                      </h3>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        The AI system performed{" "}
                        {results.dataSources?.searchQueries || "N/A"} search
                        queries to gather additional information from trusted
                        medical sources.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Blockchain Record</CardTitle>
              <CardDescription>
                Your prescription analysis is securely stored on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h3 className="font-medium">Record Information</h3>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Record ID
                      </p>
                      <p className="text-sm font-mono">{results.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Timestamp
                      </p>
                      <p className="text-sm">
                        {results.timestamp || new Date().toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Status
                      </p>
                      <p className="text-sm">
                        <Badge variant="outline" className="font-normal">
                          {results.blockchainStatus || "Recorded"}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Last Updated
                      </p>
                      <p className="text-sm">
                        {results.lastUpdated || new Date().toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpdateRecord} disabled={updating}>
                {updating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Updating Record
                  </>
                ) : (
                  "Update Blockchain Record"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
