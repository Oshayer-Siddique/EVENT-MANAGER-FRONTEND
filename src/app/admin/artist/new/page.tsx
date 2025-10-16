"use client";

import { ArtistForm } from "@/components/forms/ArtistForm";

const NewArtistPage = () => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-800">Create Artist</h1>
        <button
          type="submit"
          form="artist-form"
          className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Save
        </button>
      </div>
      <ArtistForm />
    </div>
  );
};

export default NewArtistPage;