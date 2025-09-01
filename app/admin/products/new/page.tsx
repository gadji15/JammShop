"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const ProductSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  sku: z.string().optional(),
  short_description: z.string().max(200).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Prix invalide"),
  compare_price: z.coerce.number().min(0).optional(),
  stock_quantity: z.coerce.number().int().min(0),
  low_stock_threshold: z.coerce.number().int().min(0).default(5),
  is_active: z.boolean().default(true),
  category_id: z.string().uuid("Catégorie requise"),
  supplier_id: z.string().uuid().optional().or(z.literal("")),
  images: z.array(z.string().url()).default([]),
})

type ProductFormValues = z.infer<typeof ProductSchema>

interface Category { id: string; name: string }
interface Supplier { id: string; name: string }

export default function NewProductPage() {
  const supabase = createClient()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [uploading, setUploading] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { isSubmitting, errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: "",
      sku: "",
      short_description: "",
      description: "",
      price: 0,
      compare_price: undefined,
      stock_quantity: 0,
      low_stock_threshold: 5,
      is_active: true,
      category_id: "" as unknown as string,
      supplier_id: "" as unknown as string,
      images: [],
    },
  })

  const images = watch("images")

  useEffect(() => {
    // Load categories and suppliers
    const load = async () => {
      const { data: cats } = await supabase.from("categories").select("id,name").order("name")
      setCategories(cats || [])
      const { data: sups } = await supabase.from("suppliers").select("id,name").order("name")
      setSuppliers(sups || [])
    }
    load()
  }, [supabase])

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/['"]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-")

  const ensureUniqueSlug = async (base: string): Promise<string> => {
    let slug = slugify(base)
    let i = 1
    while (true) {
      const { data } = await supabase.from("products").select("id").eq("slug", slug).limit(1).maybeSingle()
      if (!data) return slug
      slug = `${slugify(base)}-${i++}`
    }
  }

  const onUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg"
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage.from("product-images").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        })
        if (error) throw error
        const { data } = supabase.storage.from("product-images").getPublicUrl(path)
        urls.push(data.publicUrl)
      }
      setValue("images", [...images, ...urls], { shouldValidate: true })
      toast.success(`${urls.length} image(s) ajoutée(s)`)
    } catch (e) {
      console.error(e)
      toast.error("Échec de l'upload des images. Vérifiez le bucket 'product-images'.")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (url: string) => {
    setValue("images", images.filter((u) => u !== url), { shouldValidate: true })
  }

  const onSubmit = async (values: ProductFormValues) => {
    try {
      // verify category
      if (!values.category_id) {
        toast.error("Veuillez choisir une catégorie")
        return
      }

      const slug = await ensureUniqueSlug(values.name)

      const { error } = await supabase.from("products").insert({
        name: values.name,
        slug,
        sku: values.sku || null,
        short_description: values.short_description || null,
        description: values.description || null,
        price: values.price,
        compare_price: values.compare_price ?? null,
        stock_quantity: values.stock_quantity,
        low_stock_threshold: values.low_stock_threshold,
        is_active: values.is_active,
        category_id: values.category_id,
        supplier_id: values.supplier_id || null,
        images: values.images,
      })

      if (error) {
        console.error(error)
        toast.error("Erreur lors de la création du produit")
        return
      }

      toast.success("Produit créé avec succès")
      router.push("/admin/products")
    } catch (e) {
      console.error(e)
      toast.error("Une erreur est survenue")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouveau produit</h1>
          <p className="text-gray-600">Créez un produit lié au catalogue public</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations principales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom</Label>
                  <Input id="name" placeholder="Ex: iPhone 15 Pro" {...register("name")} />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" placeholder="Ex: IP15P-256-GRY" {...register("sku")} />
                </div>
              </div>

              <div>
                <Label htmlFor="short_description">Description courte</Label>
                <Input id="short_description" placeholder="Résumé court (<= 200 chars)" {...register("short_description")} />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={6} placeholder="Description détaillée" {...register("description")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input type="file" accept="image/*" multiple onChange={(e) => onUploadImages(e.target.files)} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {images.map((url) => (
                  <div key={url} className="relative rounded border overflow-hidden">
                    <img src={url} alt="product" className="h-32 w-full object-cover" />
                    <Button
                      type="button"
                      variant="outline"
                      className="absolute top-2 right-2 bg-white/80"
                      onClick={() => removeImage(url)}
                    >
                      Retirer
                    </Button>
                  </div>
                ))}
              </div>
              {uploading && <p className="text-sm text-gray-500">Upload en cours...</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Catégorie</Label>
                <Select onValueChange={(v) => setValue("category_id", v as any, { shouldValidate: true })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && <p className="text-sm text-red-600 mt-1">{errors.category_id.message}</p>}
              </div>

              <div>
                <Label>Fournisseur</Label>
                <Select onValueChange={(v) => setValue("supplier_id", v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="(Optionnel) Choisir un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prix et stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Prix</Label>
                  <Input id="price" type="number" step="0.01" {...register("price")} />
                  {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <Label htmlFor="compare_price">Prix barré (optionnel)</Label>
                  <Input id="compare_price" type="number" step="0.01" {...register("compare_price")} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock_quantity">Stock</Label>
                  <Input id="stock_quantity" type="number" {...register("stock_quantity")} />
                </div>
                <div>
                  <Label htmlFor="low_stock_threshold">Seuil alerte stock</Label>
                  <Input id="low_stock_threshold" type="number" {...register("low_stock_threshold")} />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={watch("is_active")}
                  onCheckedChange={(v) => setValue("is_active", Boolean(v), { shouldValidate: true })}
                />
                <Label htmlFor="is_active">Actif (visible sur le site)</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting || uploading}>
              Enregistrer le produit
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
              Annuler
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}