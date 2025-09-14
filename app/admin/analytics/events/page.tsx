"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Download, RefreshCw, Search } from "lucide-react"

type AnalyticsEvent = {
  id: string
  user_id: string | null
  name: string
  props: any
  ip: string | null
  ua: string | null
  created_at: string
}

type ApiResponse = {
  data: AnalyticsEvent[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  error?: string
}

function toCSV(rows: string[][]) {
  const esc = (v: any) => {
    const s = String(v ?? "")
    if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  return rows.map((r) => r.map(esc).join(",")).join("\n")
}

export default function AdminAnalyticsEventsPage() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [nameFilter, setNameFilter] = useState("")
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  const fetchEvents = async (opts?: { page?: number; pageSize?: number; name?: string }) => {
    const p = opts?.page ?? page
    const ps = opts?.pageSize ?? pageSize
    const n = (opts?.name ?? nameFilter).trim()
    const params = new URLSearchParams({ page: String(p), pageSize: String(ps) })
    if (n) params.set("name", n)
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?${params.toString()}`, { cache: "no-store" })
      const json: ApiResponse = await res.json()
      if ((json as any).error) {
        console.error(json)
        setEvents([])
        setTotal(0)
      } else {
        setEvents(json.data || [])
        setTotal(json.total || 0)
      }
    } catch (e) {
      console.error(e)
      setEvents([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize])

  const onSearch = () => {
    setPage(1)
    fetchEvents({ page: 1, pageSize, name: nameFilter })
  }

  const exportPageCSV = () => {
    const rows: string[][] = [
      ["created_at", "name", "user_id", "ip", "ua", "props"],
      ...events.map((e) => [
        e.created_at,
        e.name,
        e.user_id || "",
        e.ip || "",
        (e.ua || "").slice(0, 120),
        JSON.stringify(e.props ?? {}),
      ]),
    ]
    const csv = toCSV(rows)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics_events_page_${page}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAllCSV = async () => {
    setLoading(true)
    try {
      const rows: string[][] = [["created_at", "name", "user_id", "ip", "ua", "props"]]
      const ps = 100
      const n = nameFilter.trim()
      let p = 1
      while (true) {
        const params = new URLSearchParams({ page: String(p), pageSize: String(ps) })
        if (n) params.set("name", n)
        const res = await fetch(`/api/analytics?${params.toString()}`, { cache: "no-store" })
        const json: ApiResponse = await res.json()
        const data = json.data || []
        for (const e of data) {
          rows.push([
            e.created_at,
            e.name,
            e.user_id || "",
            e.ip || "",
            (e.ua || "").slice(0, 200),
            JSON.stringify(e.props ?? {}),
          ])
        }
        if (p >= (json.totalPages || 1)) break
        p += 1
      }
      const csv = toCSV(rows)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `analytics_events_all_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Events</h1>
          <p className="text-gray-600">Visualisez les événements collectés (hero, CTA, recherche, etc.)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchEvents()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={exportPageCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export page
          </Button>
          <Button size="sm" onClick={exportAllCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export tout
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>Filtre & pagination</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {total.toLocaleString()} événements
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-2 w-full md:max-w-md">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Filtrer par nom d'événement (ex: hero_view)"
              />
              <Button onClick={onSearch} disabled={loading}>
                Rechercher
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Page</label>
              <Input
                type="number"
                value={page}
                onChange={(e) => setPage(Math.max(1, Number(e.target.value || 1)))}
                className="w-20"
                min={1}
                max={totalPages}
              />
              <span className="text-sm text-gray-600">/ {totalPages}</span>
              <label className="text-sm text-gray-600 ml-4">Taille</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-9 rounded-md border border-gray-300 px-2 text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Event</th>
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">IP</th>
                  <th className="py-2 pr-4">UA</th>
                  <th className="py-2 pr-4">Props</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2 pr-4">
                        <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                      </td>
                      <td className="py-2 pr-4">
                        <div className="h-4 w-28 bg-gray-200 animate-pulse rounded" />
                      </td>
                      <td className="py-2 pr-4">
                        <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                      </td>
                      <td className="py-2 pr-4">
                        <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                      </td>
                      <td className="py-2 pr-4">
                        <div className="h-4 w-40 bg-gray-200 animate-pulse rounded" />
                      </td>
                      <td className="py-2 pr-4">
                        <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
                      </td>
                    </tr>
                  ))
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      Aucun événement trouvé
                    </td>
                  </tr>
                ) : (
                  events.map((e) => (
                    <tr key={e.id} className="border-b align-top">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {new Date(e.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                          {e.name}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">{e.user_id || "-"}</td>
                      <td className="py-2 pr-4">{e.ip || "-"}</td>
                      <td className="py-2 pr-4">
                        <div className="max-w-xs truncate" title={e.ua || ""}>
                          {e.ua || "-"}
                        </div>
                      </td>
                      <td className="py-2 pr-4">
                        <pre className="max-w-lg whitespace-pre-wrap break-words text-xs bg-gray-50 p-2 rounded">
                          {JSON.stringify(e.props ?? {}, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}