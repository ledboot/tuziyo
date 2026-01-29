import { ImageResponse } from "@vercel/og";

export async function loader({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const title = url.searchParams.get("title") || "tuziyo";
    const description =
      url.searchParams.get("description") ||
      "Professional AI Image Tools | Free & Secure";
    const page = url.searchParams.get("page") || "home";

    // Define page-specific colors and icons
    const pageConfig: Record<
      string,
      { gradient: [string, string]; icon: string }
    > = {
      home: { gradient: ["#0f172a", "#1e293b"], icon: "🎨" },
      inpainting: { gradient: ["#0f172a", "#134e4a"], icon: "🪄" },
      resize: { gradient: ["#0f172a", "#1e3a8a"], icon: "📐" },
      crop: { gradient: ["#0f172a", "#7c2d12"], icon: "✂️" },
      convert: { gradient: ["#0f172a", "#581c87"], icon: "🔄" },
    };

    const config = pageConfig[page] || pageConfig.home;

    const imageResponse = new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${config.gradient[0]} 0%, ${config.gradient[1]} 100%)`,
          position: "relative",
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            background:
              "radial-gradient(circle at 25% 25%, #00c2b8 0%, transparent 50%), radial-gradient(circle at 75% 75%, #00c2b8 0%, transparent 50%)",
          }}
        />

        {/* Content Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px",
            zIndex: 10,
          }}
        >
          {/* Icon */}
          <div
            style={{
              fontSize: 120,
              marginBottom: 40,
            }}
          >
            {config.icon}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "white",
              textAlign: "center",
              marginBottom: 24,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 32,
              color: "#94a3b8",
              textAlign: "center",
              maxWidth: 900,
              lineHeight: 1.4,
            }}
          >
            {description}
          </div>

          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 48,
              padding: "12px 32px",
              background: "rgba(0, 194, 184, 0.1)",
              borderRadius: 999,
              border: "2px solid rgba(0, 194, 184, 0.3)",
            }}
          >
            <div
              style={{
                fontSize: 24,
                color: "#00c2b8",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              🔒 100% Private
            </div>
          </div>
        </div>

        {/* Bottom Brand */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#64748b",
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          <div>tuziyo.com</div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      },
    );

    // Return with proper headers
    return new Response(imageResponse.body, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      status: 200,
    });
  } catch (error) {
    console.error("OG Image generation error:", error);
    return new Response("Error generating image", { status: 500 });
  }
}
