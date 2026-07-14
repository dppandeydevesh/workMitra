const urlRegex = /(https?:\/\/[^\s]+)/i;

async function getLinkPreview(text) {
  const match = text.match(urlRegex);
  if (!match) return null;

  const url = match[0];
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000); // 2-second timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    clearTimeout(id);

    if (!res.ok) return null;
    const html = await res.text();

    let title = '';
    let description = '';
    let image = '';

    // Extract title
    const titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i) ||
                       html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) title = titleMatch[1].trim();

    // Extract description
    const descMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i) ||
                      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    if (descMatch) description = descMatch[1].trim();

    // Extract image
    const imgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                     html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (imgMatch) image = imgMatch[1].trim();

    // Clean up html entities if any
    const decodeHtml = (str) => {
      if (!str) return '';
      return str
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'");
    };

    return {
      url,
      title: decodeHtml(title) || url,
      description: decodeHtml(description),
      image: image || ''
    };
  } catch (err) {
    console.error(`[LinkPreview] Failed to parse preview for url ${url}:`, err.message);
    return null;
  }
}

module.exports = { getLinkPreview };
