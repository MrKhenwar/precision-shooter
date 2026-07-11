// Remote stock imagery (Unsplash CDN). If a URL fails to load, the themed
// background colour behind the <Image> still looks clean — no crash.
const U = (id, w = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const IMAGES = {
  // Auth hero — focused athlete / range vibe
  authHero: U('photo-1517649763962-0c623066013b'),
  // Per-persona dashboard banners
  athleteBanner: U('photo-1461896836934-ffe607ba8211'),
  coachBanner: U('photo-1526676037777-05a232554f77'),
  parentBanner: U('photo-1543351611-58f69d7c1781'),
  expertBanner: U('photo-1571019613454-1cb2f99b2d8b'),
  // Generic accent used on empty states
  targetAccent: U('photo-1552072092-7f9b8d63efcb', 600),
};

export const PERSONA_BANNER = {
  athlete: IMAGES.athleteBanner,
  coach: IMAGES.coachBanner,
  parent: IMAGES.parentBanner,
  expert: IMAGES.expertBanner,
};
