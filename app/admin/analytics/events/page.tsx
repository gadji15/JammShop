"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Download, RefreshCw, Search, ChevronDown, ChevronUp, Clipboard } from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

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

function formatDay(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
}

export default function AdminAnalyticsEventsPage() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [nameFilter, setNameFilter] = useState("")
  const [userFilter, setUserFilter] = useState("")
  const [ipFilter, setIpFilter] = useState("")
  const [period, setPeriod] = useState<"7" | "30" | "90">("7")
  const [customStart, setCustomStart] = useState<string>("")
  const [customEnd, setCustomEnd] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  // client-side sorting
  const [sortKey, setSortKey] = useState<"created_at" | "name" | "user_id" | "ip">("created_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const fetchEvents = async (opts?: { page?: number; pageSize?: number; name?: string; user_id?: string; ip?: string; start?: string; end?: string }) => {
    const p = opts?.page ?? page
    const ps = opts?.pageSize ?? pageSize
    const n = (opts?.name ?? nameFilter).trim()
    const u = (opts?.user_id ?? userFilter).trim()
    const ipv = (opts?.ip ?? ipFilter).trim()

    // period handling
    let start = opts?.start ?? ""
    let end = opts?.end ?? ""
    if (!start && !end) {
      const now = new Date()
      const days = Number(period)
      const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      start = since.toISOString()
      end = now.toISOString()
    }

    const params = new URLSearchParams({ page: String(p), pageSize: String(ps) })
    if (n) params.set("name", n)
    if (u) params.set("user_id", u)
    if (ipv) params.set("ip", ipv)
    if (start) params.set("start", start)
    if (end) params.set("end", end)

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
    fetchEvents({ page: 1, pageSize, name: nameFilter, user_id: userFilter, ip: ipFilter, start: customStart, end: customEnd })
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

  // aggregated chart data: last 7 days by top event names (others grouped)
  const chartData = useMemo(() => {
    const days: { label: string; date: Date }[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      days.push({ label: formatDay(d), date: new Date(d.getFullYear(), d.getMonth(), d.getDate()) })
    }
    // count by name
    const countsByName = new Map<string, number>()
    events.forEach((e) => countsByName.set(e.name, (countsByName.get(e.name) || 0) + 1))
    const topNames = Array.from(countsByName.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([n]) => n)
    // build series
    return days.map((d) => {
      const row: any = { day: d.label }
      const start = d.date.getTime()
      const end = start + 24 * 60 * 60 * 1000
      let other = 0
      for (const e of events) {
        const t = new Date(e.created_at).getTime()
        if (t >= start && t < end) {
          if (topNames.includes(e.name)) {
            row[e.name] = (row[e.name] || 0) + 1
          } else {
            other += 1
          }
        }
      }
      row.Autres = other
      return row
    })
  }, [events])

  const sortedEvents = useMemo(() => {
    const copy = [...events]
    copy.sort((a, b) => {
      let av: any = a[sortKey] as any
      let bv: any = b[sortKey] as any
      if (sortKey === "created_at") {
        av = new Date(a.created_at).getTime()
        bv = new Date(b.created_at).getTime()
      } else {
        av = av || ""
        bv = bv || ""
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === "asc" ? cmp : -cmp
    })
    return copy
  }, [events, sortKey, sortDir])

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const copyProps = async (e: AnalyticsEvent) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(e.props ?? {}, null, 2))
    } catch {}
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

      {/* Chart last 7 days by top event names */}
      <Card>
        <CardHeader>
          <CardTitle>7 derniers jours par type d’événement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                {chartData.length > 0 &&
                  Object.keys(chartData[0])
                    .filter((k) => k !== "day")
                    .map((key, idx) => (
                      <Bar key={key} dataKey={key} stackId="a" fill={["#3B82F6", "#10B981", "#F59E0B", "#9CA3AF"][idx % 4]} />
                    ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>Filtres, période & pagination</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {total.toLocaleString()} événements
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder="Filtrer par nom d'événement (ex: hero_view)"
                />
              </div>
              <Input
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                placeholder="Filtrer par user_id"
              />
              <Input
                value={ipFilter}
                onChange={(e) => setIpFilter(e.target.value)}
                placeholder="Filtrer par IP"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Période</label>
                <div className="flex items-center gap-2">
                  {(["7", "30", "90"] as const).map((p) => (
                    <Button
                      key={p}
                      variant={period === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPeriod(p)}
                    >
                      {p}j
                    </Button>
                  ))}
                </div>
              </div>
              <Input
                type="datetime-local"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                placeholder="Début personnalisé"
              />
              <Input
                type="datetime-local"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                placeholder="Fin personnalisée"
              />
            </div>

            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Button onClick={onSearch} disabled={loading}>
                  Rechercher
                </Button>
                <Button variant="outline" onClick={() => {
                  setNameFilter("")
                  setUserFilter("")
                  setIpFilter("")
                  setCustomStart("")
                  setCustomEnd("")
                  setPeriod("7")
                  setPage(1)
                  fetchEvents({ page: 1 })
                }}>
                  Réinitialiser
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4 cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                    Date
                    {sortKey === "created_at" ? (
                      sortDir === "asc" ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />
                    ) : null}
                  </th>
                  <th className="py-2 pr-4 cursor-pointer select-none" onClick={() => toggleSort("name")}>
                    Event
                    {sortKey === "name" ? (
                      sortDir === "asc" ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />
                    ) : null}
                  </th>
                  <th className="py-2 pr-4 cursor-pointer select-none" onClick={() => toggleSort("user_id")}>
                    User
                    {sortKey === "user_id" ? (
                      sortDir === "asc" ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />
                    ) : null}
                  </th>
                  <th className="py-2 pr-4 cursor-pointer select-none" onClick={() => toggleSort("ip")}>
                    IP
                    {sortKey === "ip" ? (
                      sortDir === "asc" ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />
                    ) : null}
                  </th>
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
                ) : sortedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      Aucun événement trouvé
                    </td>
                  </tr>
                ) : (
                  sortedEvents.map((e) => (
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
                        <div className="flex items-start gap-2">
                          <pre className="max-w-lg whitespace-pre-wrap break-words text-xs bg-gray-50 p-2 rounded">
                            {JSON.stringify(e.props ?? {}, null, 2)}
                          </pre>
                          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyProps(e)} title="Copier JSON">
                            <Clipboard className="h-4 w-4" />
                          </Button>
                        </div>
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