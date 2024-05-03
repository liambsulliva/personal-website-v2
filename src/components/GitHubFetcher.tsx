import React, { useState, useEffect } from 'react';

const GitHubFetcher = (): JSX.Element => {
  const [repos, setRepos] = useState<any[]>([]);

  useEffect(() => {
    const fetchRepos = async (page = 1) => {
      const res = await fetch(
        `https://api.github.com/users/liambsulliva/repos?&sort=pushed&per_page=100&page=${page}`
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

  return (
    <div className="flex-row rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
      {repos.map((repo, index) => (
          <div className="p-8 m-8 mt-0 bg-[#1a1c21] rounded-md">
            <a>
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 text-white">{repo.name}</h5>
            </a>
            <p className="mb-3 font-normal text-gray-400">{repo.description}</p>
            <div className="flex flex-column gap-2">
              <a href={repo.html_url} className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" target="_blank">
                  View Project
                  <svg className="rtl:rotate-180 w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                  </svg>
              </a>
              {repo.homepage ? (
              <a href={repo.homepage} className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" target="_blank">
                Live Demo
                <svg className="rtl:rotate-180 w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                </svg>
              </a>
            ) : null}
            </div>
        </div>
      ))}
    </div>
  );
};

export default GitHubFetcher;
  