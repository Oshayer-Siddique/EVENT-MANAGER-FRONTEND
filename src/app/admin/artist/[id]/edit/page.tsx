"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getArtistById } from "@/services/artistService";
import { Artist } from "@/types/artist";
import { ArtistForm } from "@/components/forms/ArtistForm";

const EditArtistPage = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState<Artist | null>(null);

  useEffect(() => {
    if (id) {
      getArtistById(id as string)
        .then(setArtist)
        .catch(console.error);
    }
  }, [id]);

  if (!artist) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <ArtistForm initialData={artist} />
    </div>
  );
};

export default EditArtistPage;
