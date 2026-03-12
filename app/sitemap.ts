import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: "https://pulsereferrals.com", lastModified },
    { url: "https://pulsereferrals.com/how-it-works", lastModified },
    // add new pages here as you build them
  ];
}

