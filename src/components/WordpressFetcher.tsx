import { useState, useEffect } from 'react';
import ReactBtn from './ReactBtn';

interface WordpressFetcherProps {
  numberOfPosts: number;
}

const WordpressFetcher = ({ numberOfPosts }: WordpressFetcherProps) => {
  const [wordpressData, setWordpressData] = useState([]);

  useEffect(() => {
    const fetchWordpressData = async () => {
      const site = `pittbusinesstotheworld.com`;
      const author = `651`; // My Author ID
      const url = `https://public-api.wordpress.com/rest/v1.1/sites/${site}/posts/?author=${author}&number=${numberOfPosts}`;

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

      setWordpressData(strippedData);
    }
    fetchWordpressData();
  }, [numberOfPosts]);

  return (
    <div className="my-8 flex-row rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
      {wordpressData.map((post: any, index: number) => (
        <div key={index}>
          <h2 className="text-left m-0 mb-2 font-bold">{post.title}</h2>
          <p className="m-0 text-gray-400">{post.excerpt}</p>
          <ReactBtn label="Read More" href={post.link} />
        </div>
      ))}
    </div>
  );
}

export default WordpressFetcher;