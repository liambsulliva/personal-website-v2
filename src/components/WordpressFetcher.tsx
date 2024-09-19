import { useState, useEffect } from "react";

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
        const regex = /(<([^>]+)>)/gi;
        const strippedTitle = post.title.replace(regex, "");
        const strippedExcerpt = post.excerpt.replace(regex, "");
        const decodedTitle = decodeEntities(strippedTitle);
        const decodedExcerpt = decodeEntities(strippedExcerpt);
        const truncatedExcerpt = decodedExcerpt.slice(0, -10); // Remove the last 10 characters for "Read More"
        return {
          title: decodedTitle,
          excerpt: truncatedExcerpt,
          link: post.URL,
        };
      });

      function decodeEntities(text: string) {
        const entities = [
          ["amp", "&"],
          ["apos", "'"],
          ["lt", "<"],
          ["gt", ">"],
          ["quot", '"'],
          ["#39", "'"],
          ["#039", "'"],
          ["#8217", "'"],
          ["#8230", "..."],
        ];
        for (const [code, char] of entities) {
          const entity = `&${code};`;
          const regex = new RegExp(entity, "g");
          text = text.replace(regex, char);
        }
        return text;
      }

      //console.log(strippedData);
      setWordpressData(strippedData);
    };
    fetchWordpressData();
  }, []);

  return (
    <div className="flex-row rounded-lg">
      {wordpressData.map((post: any, index: number) => (
        <a href={post.link} rel="noreferrer" target="_blank">
          <div className="m-8 mt-0 rounded-md border-[#333] bg-[#181818] p-8 hover:bg-[#202020]">
            <div className="flex flex-row items-center gap-2">
              <h2 className="m-0 mb-2 text-left font-bold">{post.title}</h2>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="0.75rem"
                height="0.75rem"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="#d0d0d0"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M13.5 10.5L21 3m-5 0h5v5m0 6v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"
                />
              </svg>
            </div>

            <p className="m-0 text-[#d0d0d0]">{post.excerpt}</p>
          </div>
        </a>
      ))}
    </div>
  );
};

export default WordpressFetcher;
