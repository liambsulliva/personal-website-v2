# Portfolio Page

This project is a portfolio page built with Astro. It fetches and displays photos from a Flickr account.

## Project Structure

- `Layout.astro`: This is the main layout file for the project. It sets up the basic structure of the page.
- `BackButton.astro`: This component renders a back button that navigates to the home page.
- `FlickrFetcher.jsx`: This React component fetches photos from a Flickr account using the Flickr API.

## Environment Variables

The project uses the following environment variables:

- `FLICKR_API_KEY`: The API key for the Flickr API.
- `FLICKR_USER_ID`: The user ID of the Flickr account.

## Styles

The project uses CSS for styling. The styles are defined in a `<style>` tag in the `PortfolioPage.astro` file.

## Running the Project

To run the project, use the following command:

```bash
npm run start