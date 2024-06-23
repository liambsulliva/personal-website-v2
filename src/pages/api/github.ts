import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const username = url.searchParams.get('username') || 'liambsulliva';

  if (!username) {
    return new Response(JSON.stringify({ error: 'Username is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const repos = await fetchAllRepos(username);
    
    // Filter out forked repos, personal-website-v2, and the username repo
    const filteredRepos = repos.filter(repo => 
      !repo.fork && 
      repo.name !== 'personal-website-v2' && 
      repo.name !== username &&
      repo.homepage
    );

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

async function fetchAllRepos(username: string, page = 1, allRepos: any[] = []): Promise<any[]> {
  const response = await fetch(
    `https://api.github.com/users/${username}/repos?sort=pushed&per_page=100&page=${page}`
  );
  const data = await response.json();

  if (data.length > 0) {
    allRepos.push(...data);
    return fetchAllRepos(username, page + 1, allRepos);
  } else {
    return allRepos;
  }
}