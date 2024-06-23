import type { APIRoute } from 'astro';

interface WordPressPost {
  title: string;
  excerpt: string;
  link: string;
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const site = url.searchParams.get('site') || 'pittbusinesstotheworld.com';
  const author = url.searchParams.get('author') || '651';
  const limit = url.searchParams.get('limit') || undefined; // Get the limit parameter from the URL

  try {
    const posts = await fetchWordPressPosts(site, author, limit);
    return new Response(JSON.stringify(posts), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch WordPress posts' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

async function fetchWordPressPosts(site: string, author: string, limit?: string): Promise<WordPressPost[]> {
  let url = `https://public-api.wordpress.com/rest/v1.1/sites/${site}/posts/?author=${author}`;
  
  if (limit) {
    url += `&number=${limit}`; // Append the limit parameter to the URL
  }
  
  const response = await fetch(url);
  const data = await response.json();

  return data.posts.map((post: any) => {
    const strippedTitle = stripHtml(post.title);
    const strippedExcerpt = stripHtml(post.excerpt);
    const decodedTitle = decodeEntities(strippedTitle);
    const decodedExcerpt = decodeEntities(strippedExcerpt);
    const truncatedExcerpt = decodedExcerpt.slice(0, -10); // Remove the last 10 characters for "Read More"

    return {
      title: decodedTitle,
      excerpt: truncatedExcerpt,
      link: post.URL
    };
  });
}

function stripHtml(html: string): string {
  return html.replace(/(<([^>]+)>)/gi, '');
}

function decodeEntities(text: string): string {
  const entities = [
    ['amp', '&'],
    ['apos', '\''],
    ['lt', '<'],
    ['gt', '>'],
    ['quot', '"'],
    ['#39', '\''],
    ['#039', '\''],
    ['#8217', '\''],
    ['#8230', '...']
  ];

  for (const [code, char] of entities) {
    const entity = `&${code};`;
    const regex = new RegExp(entity, 'g');
    text = text.replace(regex, char);
  }

  return text;
}