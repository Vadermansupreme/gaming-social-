
import { useState } from "react";
import SocialPost from "./SocialPost";
import { samplePosts } from "@/data/samplePosts";

interface SampleFeedProps {
  currentUserId?: string;
}

const SampleFeed = ({ currentUserId }: SampleFeedProps) => {
  return (
    <div className="w-full pb-20">
      {samplePosts.map((post) => (
        <SocialPost 
          key={post.id}
          post={post} 
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
};

export default SampleFeed;
