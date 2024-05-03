import React, { useState, useEffect } from 'react';

const WordpressFetcher = () => {
  const [wordpressData, setWordpressData] = useState([]);

  useEffect(() => {
    const fetchWordpressData = async () => {
      const site = `pittbusinesstotheworld.com`;
      const author = `651`; // My Author ID
      const url = `https://public-api.wordpress.com/rest/v1.1/sites/${site}/posts/?author=${author}`;

      const response = await fetch(url);
      const data = await response.json();
      console.log(data);

      setWordpressData(data.posts);
    }
    fetchWordpressData();
  }, []);

  return (
    <div className="flex-row rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
      {wordpressData.map((post: any, index: number) => (
        <div className="p-8 m-8 mt-0 bg-[#1a1c21] rounded-md">
          {/* I am aware of how dangrous innerHTML is. I am only importing posts from my own Wordpress account :) */}
          <h5 dangerouslySetInnerHTML={{ __html: post.title }} className="mb-2 p-1 text-2xl font-bold tracking-tight text-gray-900 text-white"/>
          <p dangerouslySetInnerHTML={{ __html: post.excerpt }} className="font-normal text-gray-400"/> 
          <style>{`
            a {
              color: gray;
              padding: 0.2rem;
            }
          `}</style>
        </div>
      ))}
    </div>
  );
}

export default WordpressFetcher;