// Server component wrapper for the client SongDetail component
import SongDetail from "../SongDetail"; // <-- if you saved SongDetail.tsx in the same folder

export default function Page() {
  // SongDetail already uses useParams(), so no props needed
  return <SongDetail />;
}
