import type { APIRoute } from 'astro';

interface Photo {
  src: string;
  width: number;
  height: number;
  srcSet: {
    src: string;
    width: number;
    height: number;
  }[];
}

export const get: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const apiKey = url.searchParams.get('apiKey');
  const userId = url.searchParams.get('userId');
  const page = url.searchParams.get('page') || '1';

  if (!apiKey || !userId) {
    return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const photos = await fetchFlickrPhotos(apiKey, userId, parseInt(page));
    return new Response(JSON.stringify(photos), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch photos' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

async function fetchFlickrPhotos(apiKey: string, userId: string, page: number): Promise<{ photos: Photo[], totalPages: number }> {
  const perPage = 20;
  const url = `https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&api_key=${apiKey}&user_id=${userId}&format=json&nojsoncallback=1&page=${page}&per_page=${perPage}`;
  
  const response = await fetch(url);
  const data = await response.json();

  const photoBatch = data.photos.photo.map((photo: any) => fetchPhotoByID(apiKey, photo.id));
  const fetchedPhotos = await Promise.all(photoBatch);

  return {
    photos: fetchedPhotos.filter((photo): photo is Photo => photo !== null),
    totalPages: data.photos.pages
  };
}

async function fetchPhotoByID(apiKey: string, photoID: string): Promise<Photo | null> {
  const url = `https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=${apiKey}&photo_id=${photoID}&format=json&nojsoncallback=1`;
  const response = await fetch(url);
  const data = await response.json();
  const photoData = data.sizes.size;

  const desiredSize = photoData.find((size: any) => size.label === "Original");
  if (!desiredSize) {
    console.error(`Desired size not found for photoID: ${photoID}`);
    return null;
  }

  return {
    src: desiredSize.source,
    width: parseInt(desiredSize.width),
    height: parseInt(desiredSize.height),
    srcSet: photoData
      .filter((_: any, index: number) => [3, 6, 9, 12].includes(index))
      .map((size: any) => ({
        src: size.source,
        width: parseInt(size.width),
        height: parseInt(size.height),
      })),
  };
}