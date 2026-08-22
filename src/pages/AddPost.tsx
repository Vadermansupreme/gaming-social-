import { Camera, Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const AddPost = () => {
  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold mb-6">Create Post</h1>
      
      <div className="space-y-4">
        <Card className="card-gradient p-6 text-center">
          <Camera className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Take Photo</h3>
          <p className="text-white mb-4">Capture your workout moment</p>
          <Button className="btn-primary w-full">Open Camera</Button>
        </Card>

        <Card className="card-gradient p-6 text-center">
          <Image className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Upload Photo</h3>
          <p className="text-white mb-4">Choose from gallery</p>
          <Button className="btn-secondary w-full">Select Photo</Button>
        </Card>

        <Card className="card-gradient p-6 text-center">
          <Video className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Record Video</h3>
          <p className="text-white mb-4">Share your workout routine</p>
          <Button className="btn-secondary w-full">Record Video</Button>
        </Card>
      </div>
    </div>
  );
};

export default AddPost;