// core/athlete/media-normalizer.ts

export interface NormalizedMediaItem {
    externalMediaId: string;
    mediaType: string | null;
    caption: string | null;
    thumbnailUrl: string | null;
    postedAt: Date | null;
    likesCount: number | null;
    commentsCount: number | null;
    viewsCount: number | null;
    engagementRate: number | null;
    hashtags: string[];
    rawData: unknown;
  }
  
  export function normalizeInstagramMedia(mediaReport: any): NormalizedMediaItem[] {
    const mediaObj = mediaReport?.media ?? {};
  
    return Object.entries(mediaObj).map(([id, post]: [string, any]) => ({
      externalMediaId: id,
      mediaType: post?.basic?.type ?? null,
      caption: post?.basic?.caption ?? null,
      thumbnailUrl: post?.basic?.thumbnail ?? null,
      postedAt: post?.basic?.time_posted ? new Date(post.basic.time_posted * 1000) : null,
      likesCount: post?.metrics?.likes_count ?? null,
      commentsCount: post?.metrics?.comments_count ?? null,
      viewsCount: post?.metrics?.video_views_count ?? null,
      engagementRate: post?.metrics?.er ?? null,
      hashtags: [],  
      rawData: post,
    }));
  }
  
  export function normalizeYoutubeMedia(mediaArray: any[]): NormalizedMediaItem[] {
    return (mediaArray ?? []).map((item: any) => ({
      externalMediaId: item?.id,
      mediaType: item?.type ?? null,
      caption: item?.description || item?.title || null,  
      thumbnailUrl: item?.thumbnail ?? null,
      postedAt: item?.time_added ? new Date(item.time_added * 1000) : null,
      likesCount: item?.metrics?.likes_count?.value ?? null,
      commentsCount: item?.metrics?.comments_count?.value ?? null,
      viewsCount: item?.metrics?.views_count?.value ?? null,
      engagementRate: item?.metrics?.er?.value ?? null,
      hashtags: item?.features?.hashtags ?? [],
      rawData: item,
    }));
  }
  
  export function normalizeTwitterMedia(mediaReport: any): NormalizedMediaItem[] {
    const mediaObj = mediaReport?.report?.features?.most_media?.data?.media ?? {};
  
    return Object.entries(mediaObj).map(([id, tweet]: [string, any]) => ({
      externalMediaId: id,
      mediaType: "tweet",
      caption: tweet?.basic?.title ?? null,  
      thumbnailUrl: null,
      postedAt: tweet?.basic?.time_iso ? new Date(tweet.basic.time_iso) : null,
      likesCount: tweet?.metrics?.favorite_count ?? null,
      commentsCount: tweet?.metrics?.reply_count ?? null,
      viewsCount: null,
      engagementRate: null,
      hashtags: tweet?.features?.hashtags ?? [],
      rawData: tweet,
    }));
  }