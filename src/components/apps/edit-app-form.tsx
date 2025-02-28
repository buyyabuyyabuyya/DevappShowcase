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
import { updateApp } from "@/lib/actions/apps";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { appTypes, categories } from "@/lib/constants";
import { UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import Image from "next/image";

const formSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().min(10).max(500),
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
});

interface EditAppFormProps {
  app: any;
}

export function EditAppForm({ app }: EditAppFormProps) {
  const router = useRouter();
  const iconInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(app.iconUrl || null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(app.imageUrls || []);
  const [existingImages, setExistingImages] = useState<string[]>(app.imageUrls || []);

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
      apiEndpoint: app.apiEndpoint || "",
      apiDocs: app.apiDocs || "",
      apiType: app.apiType || "rest",
    },
  });

  function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIconFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setImageFiles((prev) => [...prev, ...files]);
      
      // Create previews
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
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
      // Combine existing images with form values
      const updatedValues = {
        ...values,
        imageUrls: existingImages,
      };
      
      await updateApp(app._id, updatedValues, iconFile || undefined, imageFiles.length ? imageFiles : undefined);
      
      toast({
        title: "Success",
        description: "Your app has been updated successfully.",
      });
      router.push(`/apps/${app._id}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update application. Please try again.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  {...field}
                />
              </FormControl>
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
                A square image representing your app (recommended size: 512x512px)
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
                Add screenshots of your application (recommended: 16:9 aspect ratio)
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
                Link to your project's source code
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

        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push(`/apps/${app._id}`)}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1">Update Application</Button>
        </div>
      </form>
    </Form>
  );
} 