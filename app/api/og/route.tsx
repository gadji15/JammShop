import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const route = (searchParams.get("route") || "").toLowerCase()

  const title =
    searchParams.get("title") ||
    (route === "new-arrivals"
      ? "Nouveautés"
      : route === "deals"
      ? "Offres & Promotions"
      : "JammShop")

  const subtitle =
    searchParams.get("subtitle") ||
    (route === "new-arrivals"
      ? "Derniers produits ajoutés"
      : route === "deals"
      ? "Réductions vérifiées, mises à jour régulièrement"
      : "Marketplace de confiance")

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background:
            route === "deals"
              ? "linear-gradient(135deg, #ef4444 0%, #8b5cf6 100%)"
              : "linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
          fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial",
        }}
      >
        {/* halo */}
        <div
          style={{
            position: "absolute",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            filter: "blur(60px)",
            top: -180,
            left: -150,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.10)",
            filter: "blur(40px)",
            bottom: -140,
            right: -100,
          }}
        />

        <div style={{ fontSize: 60, fontWeight: 800, letterSpacing: -1, textAlign: "center", padding: "0 80px" }}>
          {title} | JammShop
        </div>
        <div style={{ marginTop: 24, fontSize: 30, opacity: 0.95, textAlign: "center", padding: "0 80px" }}>
          {subtitle}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 24,
            opacity: 0.9,
          }}
        >
          jammshop.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}