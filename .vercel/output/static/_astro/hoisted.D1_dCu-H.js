async function o(){const s=await(await fetch("/api/wordpress?site=pittbusinesstotheworld.com&author=651&limit=1")).json(),n=document.getElementById("posts-container");if(n&&s.length>0){const t=s[0],e=document.createElement("div");e.className="p-4",e.innerHTML=`
				<h2 class="text-left m-0 mb-2 font-bold">${t.title}</h2>
				<p class="m-0 text-gray-400">${t.excerpt}</p>
				<a href=${t.link} class="button flex flex-row items-center justify-center w-32 mx-auto mt-4 py-3 px-4 bg-[#282935] rounded-full transition-all duration-200 shadow-md hover:scale-105 active:scale-100" target="_blank">
					<p class="text-fill whitespace-nowrap">Read More</p>
				</a>
				`,n.appendChild(e)}}o();
