import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { productsApi } from "../../api/products";
import { Product } from "../../types";
import { toast } from "sonner";
import { X, Upload, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const schema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(200),
    description: z.string().min(10, "Description must be at least 10 characters"),
    category: z.string().min(1, "Please select a category"),
    price: z.coerce.number().positive("Price must be positive"),
    stock: z.coerce.number().min(0, "Stock cannot be negative"),
    low_stock_threshold: z.coerce.number().min(0).default(5),
});

type FormData = z.infer<typeof schema>;

interface Props {
    product?: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProductFormDrawer({ product, isOpen, onClose }: Props) {
    const qc = useQueryClient();
    const isEdit = !!product;

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: product?.name || "",
            description: product?.description || "",
            category: product?.category || "",
            price: product?.price || 0,
            stock: product?.stock || 0,
            low_stock_threshold: product?.low_stock_threshold || 5,
        },
    });

    const [files, setFiles] = useState<File[]>([]);
    const categoryValue = watch("category");

    const mutation = useMutation({
        mutationFn: (data: FormData) => {
            const formData = new FormData();
            formData.append("name", data.name);
            formData.append("description", data.description);
            formData.append("category", data.category);
            formData.append("price", data.price.toString());
            formData.append("stock", data.stock.toString());
            formData.append("low_stock_threshold", data.low_stock_threshold.toString());

            files.forEach((file) => formData.append("images", file));

            if (isEdit) {
                return productsApi.updateProduct(product._id, formData);
            }
            return productsApi.createProduct(formData);
        },
        onSuccess: () => {
            toast.success(isEdit ? "Product updated successfully" : "Product created successfully");
            qc.invalidateQueries({ queryKey: ["products", "mine"] });
            handleClose();
        },
        onError: () => {
            toast.error("Failed to save product.");
        },
    });

    const handleClose = () => {
        reset();
        setFiles([]);
        onClose();
    };

    const onSubmit = (data: FormData) => {
        mutation.mutate(data);
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={handleClose}
            />
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-900 shadow-xl flex flex-col transform transition-transform duration-300">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-lg font-semibold">{isEdit ? "Edit Product" : "Add Product"}</h2>
                    <button onClick={handleClose} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <Label>Name</Label>
                            <Input {...register("name")} />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                        </div>

                        <div>
                            <Label>Description</Label>
                            <Textarea {...register("description")} rows={4} />
                            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                        </div>

                        <div>
                            <Label>Category</Label>
                            <Select value={categoryValue} onValueChange={(val) => setValue("category", val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="food">Food</SelectItem>
                                    <SelectItem value="grooming">Grooming</SelectItem>
                                    <SelectItem value="clothing">Clothing</SelectItem>
                                    <SelectItem value="accessories">Accessories</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Price</Label>
                                <Input type="number" step="0.01" {...register("price")} />
                                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
                            </div>
                            <div>
                                <Label>Stock</Label>
                                <Input type="number" {...register("stock")} />
                                {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock.message}</p>}
                            </div>
                        </div>

                        <div>
                            <Label>Low Stock Threshold</Label>
                            <Input type="number" {...register("low_stock_threshold")} />
                            {errors.low_stock_threshold && <p className="text-xs text-red-500 mt-1">{errors.low_stock_threshold.message}</p>}
                        </div>

                        <div>
                            <Label>Images (max 5)</Label>
                            <Input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files) {
                                        const newFiles = Array.from(e.target.files).slice(0, 5 - files.length);
                                        setFiles([...files, ...newFiles]);
                                    }
                                }}
                                disabled={files.length >= 5}
                            />
                            <div className="flex flex-wrap gap-2 mt-2">
                                {files.map((file, i) => (
                                    <div key={i} className="relative w-16 h-16 border rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"
                                            onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">First image will be the primary thumbnail. Max 5MB per image.</p>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button
                        type="submit"
                        form="product-form"
                        disabled={mutation.isPending}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {mutation.isPending ? "Saving..." : "Save Product"}
                    </Button>
                </div>
            </div>
        </>
    );
}
