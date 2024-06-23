import type { APIRoute } from 'astro';

interface WordPressPost {
  title: string;
  excerpt: string;
  link: string;
}

export const get: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const site = url.searchParams.get('site') || 'pittbusinesstotheworld.com';
  const author = url.searchParams.get('author') || '651';

  try {
    const posts = await fetchWordPressPosts(site, author);
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

async function fetchWordPressPosts(site: string, author: string): Promise<WordPressPost[]> {
  const url = `https://public-api.wordpress.com/rest/v1.1/sites/${site}/posts/?author=${author}`;
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