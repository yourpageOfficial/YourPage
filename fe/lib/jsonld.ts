export function creatorJsonLd(creator: { display_name: string; bio?: string; avatar_url?: string; slug: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: creator.display_name,
    description: creator.bio,
    image: creator.avatar_url,
    url: `https://yourpage.id/c/${creator.slug}`,
  };
}

export function productJsonLd(product: { name: string; description?: string; price_idr: number }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    offers: { "@type": "Offer", price: product.price_idr, priceCurrency: "IDR" },
  };
}

export function postJsonLd(post: { title: string; created_at: string; creator?: { display_name: string } }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    author: post.creator ? { "@type": "Person", name: post.creator.display_name } : undefined,
    datePublished: post.created_at,
  };
}
