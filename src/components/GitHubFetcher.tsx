import React, { useState, useEffect } from "react";
import ReactBtn from "./ReactBtn";

const GitHubFetcher = (): JSX.Element => {
  const [repos, setRepos] = useState<any[]>([]);

  useEffect(() => {
    const fetchRepos = async (page = 1) => {
      const res = await fetch(
        `https://api.github.com/users/liambsulliva/repos?&sort=pushed&per_page=100&page=${page}`,
      );
      const data = await res.json();
      // Check if there are any repos left to fetch
      if (data.length > 0) {
        setRepos((prevRepos) => [...prevRepos, ...data]);
        fetchRepos(page + 1); // if yes, call function recursively to grab next
      } else {
        setRepos((prevRepos) => [...prevRepos]);
      }
    };
    fetchRepos();
  }, []);

  // TODO: Skip forked repos, personal-website-v2, and special repo liambsulliva
  return (
    <div className="flex-row rounded-lg dark:border-gray-700 dark:bg-gray-800">
      {repos.map((repo, index) => (
        <div className="m-8 mt-0 rounded-md bg-[#1a1c21] p-8 shadow-xl">
          <a>
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-white">
              {repo.name}
            </h5>
          </a>
          <p className="font-normal text-gray-400">{repo.description}</p>
          <div className="flex-column flex gap-2">
            <ReactBtn label="View Project" href={repo.homepage} />
            {repo.homepage ? (
              <ReactBtn label="Live Demo" href={repo.homepage} />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GitHubFetcher;
