"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createApp } from "@/app/actions/create-app";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { appTypes, categories, pricingTypes, PRO_SUBSCRIPTION } from "@/lib/constants";
import { UploadCloud, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { APP_LIMITS } from "@/lib/constants";
import { PromoteAppSection } from "@/components/dashboard/promote-app-section";
import { useToast } from "@/components/ui/use-toast";
import { getUserProfile } from "@/lib/firestore/users";
import Link from "next/link";
import { useProStatus } from "@/context/pro-status-provider";
import { compressImage } from "@/lib/utils";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function ListAppForm() {
  const router = useRouter();
  const iconInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { isPro } = useProStatus();
  const [totalDocSize, setTotalDocSize] = useState<number>(0);

  // Set a lower size limit for images to account for other fields in the document
  // Firestore has a 1MB document size limit
  const FIRESTORE_DOC_LIMIT = 1 * 1024 * 1024; // 1MB
  const METADATA_ESTIMATE = 10 * 1024; // 10KB estimate for other fields
  const MAX_TOTAL_IMAGES_SIZE = FIRESTORE_DOC_LIMIT - METADATA_ESTIMATE;
  
  // For individual file size limit, use a more conservative value
  const MAX_FILE_SIZE = isPro 
    ? Math.min(APP_LIMITS.PRO_USER.MAX_FILE_SIZE, 500 * 1024) // Max 500KB per file for PRO
    : Math.min(APP_LIMITS.FREE_USER.MAX_FILE_SIZE, 300 * 1024); // Max 300KB per file for FREE

  const formSchema = z.object({
    name: z.string().min(2).max(50),
    description: z.string()
      .min(10, "Description must be at least 10 characters")
      .max(
        isPro ? APP_LIMITS.PRO_USER.DESCRIPTION_MAX_LENGTH : APP_LIMITS.FREE_USER.DESCRIPTION_MAX_LENGTH,
        `Description cannot exceed ${isPro ? APP_LIMITS.PRO_USER.DESCRIPTION_MAX_LENGTH : APP_LIMITS.FREE_USER.DESCRIPTION_MAX_LENGTH} characters`
      ),
    appType: z.enum(appTypes.map(t => t.value) as [string, ...string[]]),
    category: z.enum(categories.map(c => c.value) as [string, ...string[]]),
    repoUrl: z.string().url().optional().or(z.literal("")),
    liveUrl: z.string().url(),
    iconUrl: z.string()
      .refine(
        (url) => url === "" || url.startsWith("data:image/") || url.startsWith("http"),
        "Icon must be a valid image URL or uploaded file"
      ),
    imageUrls: z.array(z.string()).default([]),
    youtubeUrl: z.string().url().optional().or(z.literal("")),
    isPromoted: z.boolean().optional().default(false),
    pricing: z.enum(['free', 'paid', 'freemium'] as const),
    apiEndpoint: z.string().url().optional().or(z.literal("")),
    apiDocs: z.string().url().optional().or(z.literal("")),
    apiType: z.enum(['rest', 'graphql', 'soap', 'grpc']).optional(),
    pricingModel: z.enum(['free', 'freemium', 'paid', 'subscription', 'other'] as const),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      repoUrl: "",
      liveUrl: "",
      iconUrl: "",
      youtubeUrl: "",
      imageUrls: [],
      isPromoted: false,
      pricing: 'free',
      pricingModel: "free"
    }
  });

  useEffect(() => {
    console.log('Form state:', {
      isDirty: form.formState.isDirty,
      isValid: form.formState.isValid,
      errors: form.formState.errors
    });
  }, [form.formState]);

  useEffect(() => {
    async function checkUserStatus() {
      const response = await fetch('/api/user-status');
      const data = await response.json();
      if (!form.getValues("pricingModel")) {
        form.setValue("pricingModel", data.isPro ? "paid" : "free");
      }
    }
    checkUserStatus();
  }, [form]);

  useEffect(() => {
    // Calculate total document size whenever image previews change
    let totalSize = 0;
    
    // Estimate size of text fields
    const textFieldsSize = 
      (form.getValues('name')?.length || 0) + 
      (form.getValues('description')?.length || 0) +
      (form.getValues('repoUrl')?.length || 0) +
      (form.getValues('liveUrl')?.length || 0) +
      (form.getValues('youtubeUrl')?.length || 0);
    
    totalSize += textFieldsSize;
    
    // Add size of icon
    if (iconPreview) {
      // For base64 strings, each character is approximately 1 byte
      totalSize += iconPreview.length;
    }
    
    // Add size of all images
    imagePreviews.forEach(img => {
      totalSize += img.length;
    });
    
    setTotalDocSize(totalSize);
    
    // Log the estimated document size
    const docSizeKB = (totalSize / 1024).toFixed(1);
    const docSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    const percentOfLimit = ((totalSize / FIRESTORE_DOC_LIMIT) * 100).toFixed(1);
    
    console.log(`[DocSize] Estimated doc size: ${docSizeKB}KB (${docSizeMB}MB) - ${percentOfLimit}% of Firestore limit`);
    
    // Warn if approaching Firestore limit
    if (totalSize > FIRESTORE_DOC_LIMIT * 0.8) {
      console.warn(`[DocSize] WARNING: Document size is approaching Firestore limit (${percentOfLimit}%)`);
    }
  }, [iconPreview, imagePreviews, form, FIRESTORE_DOC_LIMIT]);

  async function convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PNG, JPEG, or WebP image",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log(`[IconUpload] Processing icon: ${file.name}, size: ${(file.size / 1024).toFixed(1)}KB`);
      
      // Check if adding this file would exceed the total limit
      if (totalDocSize + file.size > MAX_TOTAL_IMAGES_SIZE) {
        console.warn(`[IconUpload] Adding this icon might exceed Firestore document limit`);
        toast({
          title: "Document size limit",
          description: "You're approaching Firestore's document size limit. This icon will be heavily compressed.",
          variant: "destructive"
        });
      }
      
      let processedFile = file;
      
      // If file is larger than our limit, compress it
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Compressing image...",
          description: "Your image is being automatically compressed to meet size requirements",
        });
        
        // Compress the image more aggressively than the individual limit if we're near total limit
        const targetSize = totalDocSize > MAX_TOTAL_IMAGES_SIZE / 2 ? 
          Math.min(MAX_FILE_SIZE, 200 * 1024) : // More aggressive 200KB if near limit
          MAX_FILE_SIZE;
        
        console.log(`[IconUpload] Compressing to target size: ${(targetSize / 1024).toFixed(1)}KB`);
        processedFile = await compressImage(file, targetSize);
        
        console.log(`[IconUpload] Compression complete: ${(processedFile.size / 1024).toFixed(1)}KB`);
        toast({
          title: "Image compressed successfully",
          description: `Reduced from ${(file.size / 1024).toFixed(1)}KB to ${(processedFile.size / 1024).toFixed(1)}KB`,
        });
      }
      
      // Convert to base64 and update form
      console.log(`[IconUpload] Converting to base64`);
      const base64 = await convertFileToBase64(processedFile);
      
      console.log(`[IconUpload] Base64 size: ${(base64.length / 1024).toFixed(1)}KB`);
      setIconFile(processedFile);
      setIconPreview(base64);
      form.setValue("iconUrl", base64, { shouldValidate: true });
    } catch (error) {
      console.error("[IconUpload] Error processing image:", error);
      toast({
        title: "Image too complex",
        description: "This image couldn't be compressed enough. Please use a smaller or simpler image.",
        variant: "destructive"
      });
    }
  }

  async function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    console.log(`[ImageUpload] Processing ${files.length} images. Current doc size: ${(totalDocSize / 1024).toFixed(1)}KB`);
    
    // First filter out invalid file types
    const validTypeFiles = files.filter(file => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} must be PNG, JPEG, or WebP`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });

    if (validTypeFiles.length === 0) return;
    
    // Calculate total size of new files
    const totalNewSize = validTypeFiles.reduce((sum, file) => sum + file.size, 0);
    console.log(`[ImageUpload] Total size of new images: ${(totalNewSize / 1024).toFixed(1)}KB`);
    
    // Check if adding these files would exceed or approach the Firestore limit
    if (totalDocSize + totalNewSize > MAX_TOTAL_IMAGES_SIZE * 0.7) {
      console.warn(`[ImageUpload] Adding these images might exceed Firestore document size limit`);
      toast({
        title: "Document size limit",
        description: "You're approaching Firestore's size limit. Only a few images can be added with heavy compression.",
        variant: "destructive"
      });
    }

    try {
      // Show compression toast if any files need compression
      const needCompression = validTypeFiles.some(file => file.size > MAX_FILE_SIZE);
      if (needCompression) {
        toast({
          title: "Compressing images...",
          description: "Your images are being automatically compressed to meet size requirements",
        });
      }

      // Calculate how much space we have left for new images
      const spaceRemaining = MAX_TOTAL_IMAGES_SIZE - totalDocSize;
      const filesCount = validTypeFiles.length;
      
      // Distribute available space among files, with a max per file
      const maxSizePerFile = Math.min(
        MAX_FILE_SIZE, 
        Math.floor(spaceRemaining / filesCount) * 0.8 // Use 80% of available space per file as buffer
      );
      
      console.log(`[ImageUpload] Space remaining: ${(spaceRemaining / 1024).toFixed(1)}KB, allocated ${(maxSizePerFile / 1024).toFixed(1)}KB per file`);

      // Process each file (compress if needed) with dynamic target sizes
      const processedFiles = await Promise.all(
        validTypeFiles.map(async (file, index) => {
          console.log(`[ImageUpload] Processing image ${index+1}/${filesCount}: ${file.name}, size: ${(file.size / 1024).toFixed(1)}KB`);
          
          if (file.size > maxSizePerFile) {
            console.log(`[ImageUpload] Image ${index+1} needs compression to ${(maxSizePerFile / 1024).toFixed(1)}KB`);
            return compressImage(file, maxSizePerFile);
          }
          return file;
        })
      );

      // Show success message if compression was done
      if (needCompression) {
        const originalSize = validTypeFiles.reduce((sum, file) => sum + file.size, 0) / 1024;
        const compressedSize = processedFiles.reduce((sum, file) => sum + file.size, 0) / 1024;
        
        console.log(`[ImageUpload] Compression complete. Original: ${originalSize.toFixed(1)}KB, Compressed: ${compressedSize.toFixed(1)}KB`);
        toast({
          title: "Images compressed successfully",
          description: `Reduced from ${originalSize.toFixed(1)}KB to ${compressedSize.toFixed(1)}KB total`,
        });
      }

      // Convert to base64 array
      console.log(`[ImageUpload] Converting ${processedFiles.length} files to base64`);
      const base64Array = await Promise.all(
        processedFiles.map(async (file) => {
          const base64 = await convertFileToBase64(file);
          console.log(`[ImageUpload] File ${file.name}: Base64 size ${(base64.length / 1024).toFixed(1)}KB`);
          return base64;
        })
      );

      // Update state and form
      setImageFiles(prev => [...prev, ...processedFiles]);
      setImagePreviews(prev => [...prev, ...base64Array]);
      
      const newImageUrls = [...form.getValues("imageUrls"), ...base64Array];
      form.setValue("imageUrls", newImageUrls, { shouldValidate: true });
      
      console.log(`[ImageUpload] Update complete. Total images: ${newImageUrls.length}`);
    } catch (error) {
      console.error("[ImageUpload] Error processing images:", error);
      toast({
        title: "Some images couldn't be processed",
        description: "Please try with smaller or simpler images",
        variant: "destructive"
      });
    }
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function removeIcon() {
    setIconFile(null);
    setIconPreview(null);
    form.setValue("iconUrl", "", { shouldValidate: true });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      console.log("Starting submission with values:", values);
      
      // Calculate final document size
      let totalSize = 
        (values.name?.length || 0) +
        (values.description?.length || 0) +
        (values.repoUrl?.length || 0) +
        (values.liveUrl?.length || 0) +
        (values.youtubeUrl?.length || 0) +
        (values.iconUrl?.length || 0);
      
      values.imageUrls?.forEach(url => {
        totalSize += url.length;
      });
      
      const docSizeKB = (totalSize / 1024).toFixed(1);
      const docSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      const percentOfLimit = ((totalSize / FIRESTORE_DOC_LIMIT) * 100).toFixed(1);
      
      console.log(`[Submission] Final doc size: ${docSizeKB}KB (${docSizeMB}MB) - ${percentOfLimit}% of Firestore limit`);
      
      if (totalSize > FIRESTORE_DOC_LIMIT) {
        console.error(`[Submission] ERROR: Document exceeds Firestore's 1MB limit: ${docSizeMB}MB`);
        throw new Error(`Document size (${docSizeMB}MB) exceeds Firestore's 1MB limit. Please reduce the number of images or their size.`);
      }
      
      const formData = {
        ...values,
        pricingModel: values.pricing,
        apiType: values.appType === 'api' ? (values.apiType || 'rest') : undefined,
        apiEndpoint: values.appType === 'api' ? values.apiEndpoint : undefined,
        apiDocs: values.appType === 'api' ? values.apiDocs : undefined,
      };
      
      console.log("Sending data to createApp with payload size:", (JSON.stringify(formData).length / 1024).toFixed(1) + "KB");
      const result = await createApp(formData);
      console.log("Received response:", result);
      
      if (!result.success) {
        if (result.error === 'MAX_APPS_REACHED') {
          toast({
            title: "Free Plan Limit Reached (3 Apps)",
            description: "You've reached the maximum of 3 apps on the Free plan. Upgrade to Pro for unlimited app listings.",
            variant: "destructive",
            action: (
              <Button asChild variant="outline" className="mt-2">
                <Link href="/settings">
                  Upgrade to Pro
                </Link>
              </Button>
            ),
            duration: 6000, // Show for longer (6 seconds)
          });
          return;
        }
        throw new Error(result.error || "Failed to create app");
      }
      
      toast({
        title: "Success",
        description: "Your app has been listed successfully.",
      });
      
      setTimeout(() => {
        if (result.appId) {
          router.push(`/apps/${result.appId}`);
        } else {
          router.push("/dashboard");
        }
      }, 500);
    } catch (error) {
      console.error("Form submission error:", error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className="space-y-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">List a New App</h1>
          {isPro ? (
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Pro Mode
            </div>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={PRO_SUBSCRIPTION.STRIPE_URL} target="_blank" rel="noopener noreferrer">
                Upgrade to Pro
              </Link>
            </Button>
          )}
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Application Name</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome App" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your app in detail..." 
                  className="resize-y min-h-[120px]"
                  {...field}
                  maxLength={isPro ? APP_LIMITS.PRO_USER.DESCRIPTION_MAX_LENGTH : APP_LIMITS.FREE_USER.DESCRIPTION_MAX_LENGTH}
                />
              </FormControl>
              <div className="flex justify-between items-center mt-1">
                <FormDescription>
                  Explain what your app does, its features, and why users should try it.
                </FormDescription>
                <div className={`text-xs ${
                  field.value.length > (isPro ? APP_LIMITS.PRO_USER.DESCRIPTION_MAX_LENGTH * 0.9 : APP_LIMITS.FREE_USER.DESCRIPTION_MAX_LENGTH * 0.9) 
                    ? "text-destructive font-medium" 
                    : "text-muted-foreground"
                }`}>
                  {field.value.length}/{isPro ? APP_LIMITS.PRO_USER.DESCRIPTION_MAX_LENGTH : APP_LIMITS.FREE_USER.DESCRIPTION_MAX_LENGTH}
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="appType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Application Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {appTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="repoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repository URL (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://github.com/user/repo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="liveUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Live URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://myapp.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="youtubeUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>YouTube Video URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://youtube.com/watch?v=..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="iconUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>App Icon</FormLabel>
              <FormControl>
                <div className="flex flex-col gap-2">
                  <div 
                    className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition"
                    onClick={() => iconInputRef.current?.click()}
                  >
                    {iconPreview ? (
                      <div className="relative w-32 h-32">
                        <Image
                          src={iconPreview}
                          alt="Icon preview"
                          className="rounded-md object-contain"
                          fill
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeIcon();
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload an icon
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Images will be automatically compressed if needed
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={iconInputRef}
                    onChange={handleIconChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <input 
                    type="hidden" 
                    {...field} 
                    value={field.value || ""} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrls"
          render={({ field }) => (
            <FormItem>
              <FormLabel>App Screenshots</FormLabel>
              <FormControl>
                <div className="flex flex-col gap-2">
                  <div 
                    className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition"
                    onClick={() => imagesInputRef.current?.click()}
                  >
                    <UploadCloud className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload screenshots
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isPro 
                        ? "Images must be less than 3MB in size (PRO)"
                        : "Images must be less than 2MB in size. Upgrade to PRO for larger uploads."}
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={imagesInputRef}
                    onChange={handleImagesChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-video">
                          <Image
                            src={preview}
                            alt={`Screenshot ${index + 1}`}
                            className="rounded-md object-cover"
                            fill
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Add screenshots of your application (recommended: 16:9 aspect ratio). 
                Large images will be automatically compressed to meet size requirements.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="col-span-2">
          <PromoteAppSection />
        </div>

        <FormField
          control={form.control}
          name="pricing"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pricing Model</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("pricingModel", value as 'free' | 'paid' | 'freemium' );
                }} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pricing model" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="free">
                    <div className="flex flex-col gap-1">
                      <span>Free</span>
                      <span className="text-xs text-muted-foreground">
                        This product is free to use
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="paid">
                    <div className="flex flex-col gap-1">
                      <span>Paid</span>
                      <span className="text-xs text-muted-foreground">
                        This product requires payment and there is no free option
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="freemium">
                    <div className="flex flex-col gap-1">
                      <span>Freemium</span>
                      <span className="text-xs text-muted-foreground">
                        This product requires payment but also offers a free trial or version
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose how your application is monetized
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("appType") === "api" && (
          <>
            <FormField
              control={form.control}
              name="apiType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || "rest"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select API type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="rest">REST</SelectItem>
                      <SelectItem value="graphql">GraphQL</SelectItem>
                      <SelectItem value="soap">SOAP</SelectItem>
                      <SelectItem value="grpc">gRPC</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiEndpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Base URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.example.com/v1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiDocs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Documentation URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://docs.example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </Button>
      </form>
    </Form>
  )
} 
