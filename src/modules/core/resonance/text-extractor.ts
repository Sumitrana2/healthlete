export interface ExtractedText {
  bio: string;
  hashtags: string[];
  captions: string[];
  videoTitles: string[];
}

export function extractTextFromRawData(
  provider: string,
  platform: string,
  rawData: any
): ExtractedText {
  switch (provider) {
    case "hyperauditor":
      return extractFromHyperAuditor(platform, rawData);
    default:
      return { bio: "", hashtags: [], captions: [], videoTitles: [] };
  }
}

function extractFromHyperAuditor(
  platform: string,
  rawData: any
): ExtractedText {
  switch (platform) {
    case "instagram":
      return extractHyperAuditorInstagram(rawData);
    case "youtube":
      return extractHyperAuditorYoutube(rawData);
    case "twitter":
      return extractHyperAuditorTwitter(rawData);
    default:
      return { bio: "", hashtags: [], captions: [], videoTitles: [] };
  }
}

function extractHyperAuditorInstagram(raw: any): ExtractedText {
  
  const hashtagPerf = raw?.user?.blogger_hashtags?.performance ?? {};
  const bioHashtags: string[] = [
    ...(hashtagPerf["90d"] ?? []).map((h: any) => h.text),
    ...(hashtagPerf["180d"] ?? []).map((h: any) => h.text),
  ];

  const mediaItems = raw?._extractedMedia ?? [];

  const captions = mediaItems.map((m: any) => m.caption).filter(Boolean);

  const mediaHashtags = mediaItems.flatMap((m: any) => m.hashtags ?? []);

  return {
    bio: raw?.user?.about ?? "",
    hashtags: [...new Set([...bioHashtags, ...mediaHashtags])],
    captions,
    videoTitles: [],
  };
}

function extractHyperAuditorYoutube(raw: any): ExtractedText {
  const mediaItems = raw?._extractedMedia ?? [];

  const videoTitles = mediaItems
    .map((m: any) => m.rawData?.title ?? "")
    .filter(Boolean);
  const descriptions = mediaItems
    .map((m: any) => m.caption ?? "")
    .filter(Boolean);
  const hashtags = mediaItems.flatMap((m: any) => m.hashtags ?? []);

  return {
    bio: raw?.report?.basic?.description ?? "",
    hashtags: [...new Set(hashtags)]  as string[],
    captions: descriptions,
    videoTitles,
  };
}

function extractHyperAuditorTwitter(raw: any): ExtractedText {
  const mediaItems = raw?._extractedMedia ?? [];

  const captions = mediaItems.map((m: any) => m.caption).filter(Boolean);
  const hashtags = mediaItems.flatMap((m: any) => m.hashtags ?? []);

  return {
    bio: raw?.report?.basic?.description ?? "",
    hashtags: [...new Set(hashtags)] as string[],
    captions,
    videoTitles: [],
  };
}

// function extractHyperAuditorInstagram(raw: any): ExtractedText {
//   const hashtagPerf = raw?.user?.blogger_hashtags?.performance ?? {};
//   const hashtags: string[] = [
//     ...(hashtagPerf["90d"] ?? []).map((h: any) => h.text),
//     ...(hashtagPerf["180d"] ?? []).map((h: any) => h.text),
//   ];

//   return {
//     bio: raw?.user?.about ?? "",
//     hashtags: [...new Set(hashtags)],
//     captions: [],
//     videoTitles: [],
//   };
// }

// function extractHyperAuditorYoutube(raw: any): ExtractedText {
//   const media = raw?.media ?? [];

//   const videoTitles: string[] = media.map((item: any) => item.title ?? "").filter(Boolean);
//   const descriptions: string[] = media.map((item: any) => item.description ?? "").filter(Boolean);
//   const hashtags: string[] = media.flatMap((item: any) => item.features?.hashtags ?? []);

//   return {
//     bio: raw?.report?.basic?.description ?? "",
//     hashtags: [...new Set(hashtags)] as string[],
//     captions: descriptions,
//     videoTitles,
//   };
// }

// function extractHyperAuditorTwitter(raw: any): ExtractedText {
//   const hashtagPerf = raw?.report?.features?.blogger_hashtags?.data?.performance ?? {};
//   const hashtags: string[] = [
//     ...(hashtagPerf["90d"] ?? []),
//     ...(hashtagPerf["180d"] ?? []),
//   ];

//   return {
//     bio: raw?.report?.basic?.description ?? "",
//     hashtags: [...new Set(hashtags)],
//     captions: [],
//     videoTitles: [],
//   };
// }
