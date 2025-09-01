"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const SettingsSchema = z.object({
  siteName: z.string().min(2).max(100),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(6).max(30),
  enableCOD: z.boolean(),
  enableMobileMoney: z.boolean(),
  enableOrangeMoney: z.boolean(),
  enableWave: z.boolean(),
  enableFreeMoney: z.boolean(),
})

type SettingsForm = z.infer<typeof SettingsSchema>

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const { register, handleSubmit, reset, formState } = useForm<SettingsForm>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      siteName: "JammShop",
      contactEmail: "",
      contactPhone: "",
      enableCOD: true,
      enableMobileMoney: true,
      enableOrangeMoney: true,
      enableWave: true,
      enableFreeMoney: false,
    },
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        // Table de configuration (key/value) côté Supabase
        const { data } = await supabase.from("settings").select("key,value")
        if (data && data.length) {
          const map = Object.fromEntries(data.map((r: any) => [r.key, r.value]))
          reset({
            siteName: map["siteName"] ?? "JammShop",
            contactEmail: map["contactEmail"] ?? "",
            contactPhone: map["contactPhone"] ?? "",
            enableCOD: map["enableCOD"] === "true",
            enableMobileMoney: map["enableMobileMoney"] === "true",
            enableOrangeMoney: map["enableOrangeMoney"] === "true",
            enableWave: map["enableWave"] === "true",
            enableFreeMoney: map["enableFreeMoney"] === "true",
          })
        }
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (values: SettingsForm) => {
    const entries: [string, string][] = Object.entries(values).map(([k, v]) => [k, String(v)])
    // Upsert clé/valeur
    await Promise.all(
      entries.map(async ([key, value]) => {
        await supabase.from("settings").upsert({ key, value }, { onConflict: "key" })
      }),
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">Configuration générale du site et des paiements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Général</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="siteName">Nom du site</Label>
              <Input id="siteName" placeholder="Nom du site" {...register("siteName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email de contact</Label>
              <Input id="contactEmail" type="email" placeholder="email@exemple.com" {...register("contactEmail")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Téléphone</Label>
              <Input id="contactPhone" placeholder="+221..." {...register("contactPhone")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ToggleField id="enableCOD" label="Paiement à la livraison (COD)" register={register} />
              <ToggleField id="enableMobileMoney" label="Mobile Money" register={register} />
              <ToggleField id="enableOrangeMoney" label="Orange Money" register={register} />
              <ToggleField id="enableWave" label="Wave" register={register} />
              <ToggleField id="enableFreeMoney" label="Free Money" register={register} />
            </div>
            <Separator />
            <div className="flex gap-3">
              <Button type="submit" disabled={loading || formState.isSubmitting}>
                Enregistrer
              </Button>
              <Button type="button" variant="outline" onClick={() => reset()}>
                Réinitialiser
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function ToggleField({
  id,
  label,
  register,
}: {
  id: keyof SettingsForm
  label: string
  register: ReturnType<typeof useForm>["register"]
}) {
  return (
    <label className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 cursor-pointer">
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <input type="checkbox" className="h-5 w-5" {...register(id)} />
    </label>
  )
}