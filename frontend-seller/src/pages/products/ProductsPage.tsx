import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../../api/products";
import { Product } from "../../types";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import ProductFormDrawer from "../../components/products/ProductFormDrawer";

export default function ProductsPage() {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["products", "mine", page],
        queryFn: () => productsApi.getMyProducts(page, 20),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => productsApi.deleteProduct(id),
        onSuccess: () => {
            toast.success("Product deleted successfully");
            qc.invalidateQueries({ queryKey: ["products", "mine"] });
        },
        onError: () => toast.error("Failed to delete product"),
    });

    const handleEdit = (p: Product) => {
        setEditProduct(p);
        setDrawerOpen(true);
    };

    const handleAddNew = () => {
        setEditProduct(null);
        setDrawerOpen(true);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your product catalog</p>
                </div>
                <Button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                    <Plus className="w-4 h-4" />
                    Add Product
                </Button>
            </div>

            <div className="rounded-lg border overflow-hidden bg-white dark:bg-gray-900">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800">
                            <TableHead className="w-16">Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : data?.items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 shadow-inner">
                                    <div className="text-gray-400 font-medium">No products found.</div>
                                    <div className="text-sm text-gray-500 mt-1">Click "Add Product" to create your first listing.</div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.items.map((p) => (
                                <TableRow key={p._id} className={p.is_low_stock ? "bg-amber-50 dark:bg-amber-950/20" : ""}>
                                    <TableCell>
                                        {p.image_urls.length > 0 ? (
                                            <img src={p.image_urls[0]} alt={p.name} className="w-10 h-10 rounded object-cover border" />
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400 border">No img</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {p.name}
                                        {p.is_low_stock && <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-300">Low Stock</span>}
                                    </TableCell>
                                    <TableCell className="capitalize">{p.category}</TableCell>
                                    <TableCell>${p.price.toFixed(2)}</TableCell>
                                    <TableCell className={p.is_low_stock ? "text-amber-600 font-bold" : ""}>{p.stock}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                                            if (confirm("Are you sure you want to delete this product?")) deleteMutation.mutate(p._id);
                                        }}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ProductFormDrawer product={editProduct} isOpen={drawerOpen} onClose={() => { setDrawerOpen(false); setTimeout(() => setEditProduct(null), 300); }} />
        </div>
    );
}
