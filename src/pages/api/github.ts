import type { APIRoute } from 'astro';

interface Repo {
  name: string;
  description: string;
  homepage: string | null;
  html_url: string;
  fork: boolean;
}

export const get: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const username = url.searchParams.get('username') || 'liambsulliva';

  try {
    const repos = await fetchAllRepos(username);
    const filteredRepos = filterRepos(repos);

    return new Response(JSON.stringify(filteredRepos), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch repositories' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

async function fetchAllRepos(username: string, page = 1): Promise<Repo[]> {
  const response = await fetch(
    `https://api.github.com/users/${username}/repos?sort=pushed&per_page=100&page=${page}`
  );
  const data: Repo[] = await response.json();

  if (data.length === 100) {
    // If we got 100 repos, there might be more pages
    const nextPageRepos = await fetchAllRepos(username, page + 1);
    return [...data, ...nextPageRepos];
  }

  return data;
}

function filterRepos(repos: Repo[]): Repo[] {
  return repos.filter(repo => 
    !repo.fork && 
    repo.name !== 'personal-website-v2' && 
    repo.name !== 'liambsulliva'
  );
}