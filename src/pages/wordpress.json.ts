export default async function GET({ params, request }: any) {
    const site = `pittbusinesstotheworld.com`;
    const author = `651`; // My Author ID
    const url = `https://public-api.wordpress.com/rest/v1.1/sites/${site}/posts/?author=${author}`;

    const response = await fetch(url);
    const data = await response.json();

    const strippedData = data.posts.map((post: any) => {
        const regex = /(<([^>]+)>)/gi;
        const strippedTitle = post.title.replace(regex, '');
        const strippedExcerpt = post.excerpt.replace(regex, '');
        const decodedTitle = decodeEntities(strippedTitle);
        const decodedExcerpt = decodeEntities(strippedExcerpt);
        const truncatedExcerpt = decodedExcerpt.slice(0, -10); // Remove the last 10 characters for "Read More"
        return {
            title: decodedTitle,
            excerpt: truncatedExcerpt,
            link: post.URL
        };
    });

    function decodeEntities(text: string) {
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

    return {
        body: strippedData
    };
}