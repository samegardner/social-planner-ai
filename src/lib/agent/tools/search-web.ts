interface SearchWebInput {
  query: string;
  max_results?: number;
}

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilyResult[];
}

export async function searchWeb(input: SearchWebInput) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return { error: "TAVILY_API_KEY not configured" };
  }

  const maxResults = Math.min(input.max_results || 5, 10);

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: input.query,
      search_depth: "basic",
      max_results: maxResults,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { error: `Tavily API error (${response.status}): ${text}` };
  }

  const data = (await response.json()) as TavilyResponse;

  return {
    query: input.query,
    results: data.results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
      relevance: r.score,
    })),
    count: data.results.length,
  };
}
