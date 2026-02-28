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
import { updateApp } from "@/app/actions/update-app";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { appTypes, categories, APP_LIMITS } from "@/lib/constants";
import { Loader2, UploadCloud, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { compressImage } from "@/lib/utils";
import { useProStatus } from "@/context/pro-status-provider";
import { cn } from "@/lib/utils";

// Add this constant at the top of the file
const STRIPE_URL = "https://buy.stripe.com/28o29Q2Zg1W19tmcMO";

// Add this constant at the top of the file
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

//need to re-deploy
//need to re-deploy


interface EditAppFormProps {
  app: any;
}

// Add this function for base64 conversion
async function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export function EditAppForm({ app }: EditAppFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const iconInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(app.iconUrl || null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(app.imageUrls || []);
  const [existingImages, setExistingImages] = useState<string[]>(app.imageUrls || []);
  const [isProUser, setIsProUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  
  useEffect(() => {
    async function checkUserStatus() {
      const response = await fetch('/api/user-status');
      const data = await response.json();
      setIsProUser(data.isPro);
    }
    checkUserStatus();
  }, []);

  const formSchema = z.object({
    name: z.string().min(2).max(50),
    description: z.string()
      .min(10, "Description must be at least 10 characters")
      .max(
        isProUser ? APP_LIMITS.PRO_USER.DESCRIPTION_MAX_LENGTH : APP_LIMITS.FREE_USER.DESCRIPTION_MAX_LENGTH,
        `Description cannot exceed ${isProUser ? APP_LIMITS.PRO_USER.DESCRIPTION_MAX_LENGTH : APP_LIMITS.FREE_USER.DESCRIPTION_MAX_LENGTH} characters`
      ),
    appType: z.enum(appTypes.map(t => t.value) as [string, ...string[]]),
    category: z.enum(categories.map(c => c.value) as [string, ...string[]]),
    repoUrl: z.string().url().optional().or(z.literal("")),
    liveUrl: z.string().url(),
    iconUrl: z.string().url().optional().or(z.literal("")),
    imageUrls: z.array(z.string().url()).optional(),
    youtubeUrl: z.string().url().optional().or(z.literal("")),
    apiEndpoint: z.string().url().optional(),
    apiDocs: z.string().url().optional(),
    apiType: z.enum(['rest', 'graphql', 'soap', 'grpc']).optional(),
    isPromoted: z.boolean().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: app.name,
      description: app.description,
      appType: app.appType,
      category: app.category,
      repoUrl: app.repoUrl || "",
      liveUrl: app.liveUrl,
      iconUrl: app.iconUrl || "",
      youtubeUrl: app.youtubeUrl || "",
      imageUrls: app.imageUrls || [],
      apiEndpoint: app.apiEndpoint,
      apiDocs: app.apiDocs,
      apiType: app.apiType,
      isPromoted: app.isPromoted,
    },
  });

  useEffect(() => {
    // Auto-enable promotion if user is Pro
    if (isProUser && !form.getValues("isPromoted")) {
      form.setValue("isPromoted", true);
    }
  }, [isProUser, form]);

  useEffect(() => {
    // Initialize icon preview from app data
    if (app?.iconUrl) {
      setIconPreview(app.iconUrl);
    }
    
    // Initialize image previews from app data
    if (app?.imageUrls?.length) {
      setImagePreviews(app.imageUrls);
    }
  }, [app]);

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

  function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Add file validation
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PNG, JPEG, or WebP image",
          variant: "destructive"
        });
        return;
      }

      // Process the image (compress if needed)
      (async () => {
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
      })();
    }
  }

  function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
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
      
      // Process the images (compress if needed)
      (async () => {
        try {
          // Check if any images need compression
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
          
          setImageFiles((prev) => [...prev, ...processedFiles]);
          
          // Convert to base64 array
          console.log(`[ImageUpload] Converting ${processedFiles.length} files to base64`);
          const base64Array = await Promise.all(
            processedFiles.map(async (file) => {
              const base64 = await convertFileToBase64(file);
              console.log(`[ImageUpload] File ${file.name}: Base64 size ${(base64.length / 1024).toFixed(1)}KB`);
              return base64;
            })
          );
          
          // Update state and form values
          setImagePreviews(prev => [...prev, ...base64Array]);
          const existingUrls: string[] = form.getValues("imageUrls") || [];
          const newImageUrls = [...existingUrls, ...base64Array];
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
      })();
    }
  }

  function removeImage(index: number) {
    // Check if it's a new image or an existing one
    if (index < existingImages.length) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      const adjustedIndex = index - existingImages.length;
      setImageFiles((prev) => prev.filter((_, i) => i !== adjustedIndex));
    }
    
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function removeIcon() {
    setIconFile(null);
    setIconPreview(null);
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
      
      console.log("Sending data to updateApp with payload size:", (JSON.stringify(values).length / 1024).toFixed(1) + "KB");
      
      // Update app data
      const result = await updateApp(app.id, values);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to update application");
      }
      
      toast({
        title: "Success",
        description: "Your application has been updated.",
      });
      
      setTimeout(() => {
        router.push(`/apps/${app.id}`);
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

  // Add this useEffect to reset form state when app prop changes
  useEffect(() => {
    console.log("[EditForm] App data changed, resetting form");
    form.reset({
      name: app.name,
      description: app.description,
      appType: app.appType,
      category: app.category,
      repoUrl: app.repoUrl || "",
      liveUrl: app.liveUrl,
      iconUrl: app.iconUrl || "",
      youtubeUrl: app.youtubeUrl || "",
      imageUrls: app.imageUrls || [],
      apiEndpoint: app.apiEndpoint,
      apiDocs: app.apiDocs,
      apiType: app.apiType,
      isPromoted: app.isPromoted,
    });
  }, [app, form]);

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className="space-y-6"
      >
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
                  placeholder="Describe your application..."
                  className="resize-y min-h-[120px]"
                  {...field}
                  maxLength={isProUser ? APP_LIMITS.PRO_USER.DESCRIPTION_MAX_LENGTH : APP_LIMITS.FREE_USER.DESCRIPTION_MAX_LENGTH}
                />
              </FormControl>
              <div className="flex justify-between items-center mt-1">
                <FormDescription>
                  Explain what your app does, its features, and why users should try it.
                </FormDescription>
                <div className={`text-xs ${
                  field.value.length > (isProUser ? APP_LIMITS.PRO_USER.DESCRIPTION_MAX_LENGTH * 0.9 : APP_LIMITS.FREE_USER.DESCRIPTION_MAX_LENGTH * 0.9) 
                    ? "text-destructive font-medium" 
                    : "text-muted-foreground"
                }`}>
                  {field.value.length}/{isProUser ? APP_LIMITS.PRO_USER.DESCRIPTION_MAX_LENGTH : APP_LIMITS.FREE_USER.DESCRIPTION_MAX_LENGTH}
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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

        <FormField
          control={form.control}
          name="iconUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>App Icon</FormLabel>
              <div className="space-y-2">
                {iconPreview ? (
                  <div className="relative w-24 h-24">
                    <Image 
                      src={iconPreview} 
                      alt="App icon" 
                      width={96} 
                      height={96} 
                      className="rounded-lg object-cover"
                    />
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={removeIcon}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => iconInputRef.current?.click()}
                    className="w-24 h-24 border-dashed"
                  >
                    <UploadCloud className="h-6 w-6" />
                  </Button>
                )}
                <FormControl>
                  <Input value={field.value} hidden />
                </FormControl>
                <input 
                  type="file" 
                  ref={iconInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleIconChange}
                />
              </div>
              <FormDescription>
                A square image representing your app (recommended size: 512x512px).
                Large images will be automatically compressed.
              </FormDescription>
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
              <div className="space-y-2">
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <Image 
                          src={preview} 
                          alt={`Screenshot ${index + 1}`}
                          width={300}
                          height={200}
                          className="rounded-lg object-cover border aspect-video"
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
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => imagesInputRef.current?.click()}
                  className="w-full h-24 border-dashed"
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload Screenshots
                </Button>
                <FormControl>
                  <Input value={field.value?.join(',')} hidden />
                </FormControl>
                <input 
                  type="file" 
                  ref={imagesInputRef} 
                  className="hidden" 
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                />
              </div>
              <FormDescription>
                Add screenshots of your application (recommended: 16:9 aspect ratio).
                Large images will be automatically compressed to meet size requirements.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="repoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GitHub Repository URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://github.com/username/repo" {...field} />
              </FormControl>
              <FormDescription>
                Link to your project&apos;s source code
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="liveUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Live Demo URL</FormLabel>
              <FormControl>
                <Input placeholder="https://your-app.com" {...field} />
              </FormControl>
              <FormDescription>
                Where users can try your application
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="youtubeUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>YouTube Demo URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://youtube.com/watch?v=..." {...field} />
              </FormControl>
              <FormDescription>
                Link to a video demonstration of your app
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select API type" />
                    </SelectTrigger>
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

        <FormField
          control={form.control}
          name="isPromoted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Promotion Status
                </FormLabel>
                <FormDescription>
                  {isProUser 
                    ? "Promoted apps appear at the top of listings with a special badge."
                    : "Upgrade to Pro to promote your apps."}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={isProUser ? field.value : false}
                  onCheckedChange={field.onChange}
                  disabled={!isProUser}
                  aria-readonly={!isProUser}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push(`/apps/${app.id}`)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                Updating...
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Update Application"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
