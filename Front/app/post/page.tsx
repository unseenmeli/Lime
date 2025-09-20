import UploadSongForm from "./UploadSongForm";

export default function PostPage() {
  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold mb-4">Post a Song</h1>
      <UploadSongForm />
    </div>
  );
}
