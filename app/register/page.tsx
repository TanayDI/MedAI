"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { analyzePrescription } from "@/lib/actions";
import { ImagePlus, X, ArrowRight } from "lucide-react";
import Link from "next/link";

const formSchema = z
  .object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters.",
    }),
    age: z
      .string()
      .refine(
        (val) => !isNaN(Number.parseInt(val)) && Number.parseInt(val) > 0,
        {
          message: "Age must be a positive number.",
        },
      ),
    gender: z.string().min(1, {
      message: "Please select a gender.",
    }),
    symptoms: z.string(),
    medications: z.string(),
    prescription: z.string(),
    prescriptionImage: z.any(),
  })
  .refine(
    (data) => {
      // If there's no image, require the other fields
      if (!data.prescriptionImage) {
        return (
          data.symptoms.length >= 10 &&
          data.medications.length >= 3 &&
          data.prescription.length >= 10
        );
      }
      return true;
    },
    {
      message:
        "Please provide either a prescription image or fill in all the prescription details",
      path: ["prescription"], // This will show the error under the prescription field
    },
  );

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: "",
      gender: "",
      symptoms: "",
      medications: "",
      prescription: "",
      prescriptionImage: null,
    },
    mode: "onChange", // This will show validation errors as the user types
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const formData = { ...values };

      // Convert image to base64 if it exists
      if (values.prescriptionImage) {
        const reader = new FileReader();
        const base64Promise = new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(values.prescriptionImage);
        });
        formData.prescriptionImage = await base64Promise;
      }

      // Store form data in session storage for the results page
      sessionStorage.setItem("formData", JSON.stringify(formData));

      // Call the server action to analyze the prescription
      await analyzePrescription(formData);

      // Redirect to the results page
      router.push("/dashboard");
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
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
      <div className="container max-w-4xl py-10 container mx-auto max-w-6xl px-4 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Prescription Check Registration</CardTitle>
            <CardDescription>
              Enter your information and prescription details for AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input placeholder="35" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">
                              Prefer not to say
                            </option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="medications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Medications</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Lisinopril, Metformin, etc."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          List any medications you are currently taking
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="symptoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Symptoms{" "}
                        {!form.getValues("prescriptionImage") && "(Required)"}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            form.getValues("prescriptionImage")
                              ? "Optional when providing an image"
                              : "Describe your symptoms in detail"
                          }
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {form.getValues("prescriptionImage")
                          ? "Optional when providing a prescription image"
                          : "Provide a detailed description of your symptoms"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prescription Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the prescription details you want to check"
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include medication names, dosages, frequency, and
                        duration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prescriptionImage"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Prescription Image (Optional)</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() =>
                                document.getElementById("image-upload")?.click()
                              }
                            >
                              <ImagePlus className="mr-2 h-4 w-4" />
                              Upload Image
                            </Button>
                            <input
                              id="image-upload"
                              type="file"
                              className="hidden"
                              accept="image/jpeg,image/png,image/jpg,image/webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Validate file size (e.g., max 5MB)
                                  if (file.size > 5 * 1024 * 1024) {
                                    form.setError("prescriptionImage", {
                                      message:
                                        "Image size should be less than 5MB",
                                    });
                                    return;
                                  }

                                  // Validate file type
                                  if (
                                    !file.type.match(
                                      /^image\/(jpeg|png|jpg|webp)$/,
                                    )
                                  ) {
                                    form.setError("prescriptionImage", {
                                      message:
                                        "Please upload a valid image (JPEG, PNG, or WebP)",
                                    });
                                    return;
                                  }

                                  onChange(file);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setImagePreview(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              {...field}
                            />
                          </div>
                          {imagePreview && (
                            <div className="relative w-full aspect-video">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 z-10"
                                onClick={() => {
                                  setImagePreview(null);
                                  onChange(null);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Image
                                src={imagePreview}
                                alt="Prescription preview"
                                fill
                                className="object-contain rounded-md"
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload a clear image of your prescription
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    "Submit for Analysis"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-gray-500">
              Your data is securely processed and stored
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
