import React, { useState, useEffect } from 'react';
import { stripHtml } from "string-strip-html";
import ReactBtn from './ReactBtn';

const WordpressFetcher = () => {
  const [wordpressData, setWordpressData] = useState([]);

  useEffect(() => {
    const fetchWordpressData = async () => {
      const site = `pittbusinesstotheworld.com`;
      const author = `651`; // My Author ID
      const url = `https://public-api.wordpress.com/rest/v1.1/sites/${site}/posts/?author=${author}`;

      const response = await fetch(url);
      const data = await response.json();

      const strippedData = data.posts.map((post: any) => {
        return {
          title: stripHtml(post.title).result,
          excerpt: stripHtml(post.excerpt).result.replace("Read More", ""),
          link: post.URL
        };
      });

      setWordpressData(strippedData);
    }
    fetchWordpressData();
  }, []);

  return (
    <div className="flex-row rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
      {wordpressData.map((post: any, index: number) => (
        <div className="w-5/6 p-8 m-8 mt-0 bg-[#1a1c21] rounded-md">
          <h2 className="text-left m-0 mb-2 font-bold">{post.title}</h2>
          <p className="m-0 text-gray-400">{post.excerpt}</p>
          <ReactBtn label="Read More" href={post.link} />
        </div>
      ))}
    </div>
  );
}

export default WordpressFetcher;