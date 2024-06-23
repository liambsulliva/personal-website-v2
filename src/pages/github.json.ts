export default async function GET({ params, request }: any) {
    const res = await fetch(
        `https://api.github.com/users/liambsulliva/repos?&sort=pushed&per_page=100&page=1`
    );
    const data = await res.json();
    const repos = data.filter((repo: any) => !repo.fork && repo.name !== 'personal-website-v2' && repo.name !== 'liambsulliva');
    return {
        repos
    };
}