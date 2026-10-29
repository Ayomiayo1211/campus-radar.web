
interface Env {
  DB: D1Database;
}

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Access-Control-Allow-Origin": "*",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method !== "GET") {
      return Response.json(
        { error: "Method not allowed" },
        { status: 405, headers }
      );
    }

    if (url.pathname === "/health") {
      try {
        const result = await env.DB
          .prepare("SELECT 1 AS connected")
          .first<{ connected: number }>();

        return Response.json(
          { ok: result?.connected === 1 },
          { headers }
        );
      } catch {
        return Response.json(
          { ok: false, error: "Database unavailable" },
          { status: 503, headers }
        );
      }
    }

    if (url.pathname === "/stories") {
      try {
        const requestedLimit = Number(url.searchParams.get("limit") ?? 10);
        const limit = Number.isFinite(requestedLimit)
          ? Math.max(1, Math.min(25, Math.floor(requestedLimit)))
          : 10;
        const contentType = url.searchParams.get("type")?.trim().toUpperCase();
        const allowedTypes = new Set(["NEWS", "FEATURE", "OPINION", "THE_RADAR"]);
        if (contentType && !allowedTypes.has(contentType)) {
          return Response.json({ error: "Invalid content type" }, { status: 400, headers });
        }

        const query = contentType
          ? env.DB.prepare(`
              SELECT id, slug, title, excerpt, contentType,
                     authorName, coverImage, publishedAt
              FROM Story
              WHERE status = 'PUBLISHED' AND contentType = ?
              ORDER BY publishedAt DESC
              LIMIT ?
            `).bind(contentType, limit)
          : env.DB.prepare(`
              SELECT id, slug, title, excerpt, contentType,
                     authorName, coverImage, publishedAt
              FROM Story
              WHERE status = 'PUBLISHED'
              ORDER BY publishedAt DESC
              LIMIT ?
            `).bind(limit);
        const result = await query.all();

        return Response.json(
          { stories: result.results, count: result.results.length },
          { headers }
        );
      } catch {
        return Response.json(
          { error: "Unable to retrieve stories" },
          { status: 500, headers }
        );
      }
    }

    const articleMatch = url.pathname.match(/^\/stories\/([^/]+)$/);
    
    if (url.pathname === "/radar" || url.pathname === "/opportunities") {
      try {
        const requestedLimit = Number(url.searchParams.get("limit") ?? 10);
        const limit = Number.isFinite(requestedLimit)
          ? Math.max(1, Math.min(25, Math.floor(requestedLimit)))
          : 10;

        if (url.pathname === "/radar") {
          const result = await env.DB
            .prepare(`
              SELECT
                id, slug, title, summary, kind, origin,
                commercialStatus, coverImage, eventDate,
                location, link, publishedAt
              FROM RadarItem
              WHERE status = 'PUBLISHED'
              ORDER BY publishedAt DESC
              LIMIT ?
            `)
            .bind(limit)
            .all();

          return Response.json(
            { items: result.results, count: result.results.length },
            { headers }
          );
        }

        const result = await env.DB
          .prepare(`
            SELECT
              id, slug, title, organisation, type,
              description, deadline, applicationUrl,
              origin, commercialStatus, publishedAt
            FROM Opportunity
            WHERE status = 'PUBLISHED'
            ORDER BY publishedAt DESC
            LIMIT ?
          `)
          .bind(limit)
          .all();

        return Response.json(
          { opportunities: result.results, count: result.results.length },
          { headers }
        );
      } catch {
        return Response.json(
          { error: "Unable to retrieve content" },
          { status: 500, headers }
        );
      }
    }


    if (articleMatch) {
      try {
        const slug = decodeURIComponent(articleMatch[1]);

        const story = await env.DB
          .prepare(`
            SELECT
              id, slug, title, excerpt, body, contentType,
              origin, commercialStatus, featured, coverImage,
              authorName, publishedAt, createdAt, updatedAt
            FROM Story
            WHERE slug = ? AND status = 'PUBLISHED'
            LIMIT 1
          `)
          .bind(slug)
          .first();

        if (!story) {
          return Response.json(
            { error: "Story not found" },
            { status: 404, headers }
          );
        }

        const storyId = (story as { id: string }).id;

        const [tagResult, imageResult] = await Promise.all([
          env.DB
            .prepare(`
              SELECT tag
              FROM StoryTag
              WHERE storyId = ?
              ORDER BY tag ASC
            `)
            .bind(storyId)
            .all(),

          env.DB
            .prepare(`
              SELECT
                id, mediaId, url, altText, caption,
                photographer, displayOrder
              FROM StoryImage
              WHERE storyId = ?
              ORDER BY displayOrder ASC
            `)
            .bind(storyId)
            .all(),
        ]);

        return Response.json(
          {
            story: {
              ...story,
              tags: tagResult.results.map(
                (item) => (item as { tag: string }).tag
              ),
              images: imageResult.results,
            },
          },
          { headers }
        );
      } catch {
        return Response.json(
          { error: "Unable to retrieve story" },
          { status: 500, headers }
        );
      }
    }

    return Response.json(
      { error: "Not found" },
      { status: 404, headers }
    );
  },
};
