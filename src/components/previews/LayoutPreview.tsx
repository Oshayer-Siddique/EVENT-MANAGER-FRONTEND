"use client";

import React from 'react';

interface LayoutPreviewProps {
  typeName: string;
  totalRows?: number;
  totalCols?: number;
  totalTables?: number;
  chairsPerTable?: number;
  standingCapacity?: number;
}

const Seat = () => <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>;
const Table = ({ chairs }: { chairs: number }) => (
  <div className="relative w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center m-2">
    <div className="absolute text-white font-bold text-xs">{chairs}</div>
  </div>
);

const LayoutPreview: React.FC<LayoutPreviewProps> = ({
  typeName,
  totalRows = 0,
  totalCols = 0,
  totalTables = 0,
  chairsPerTable = 0,
  standingCapacity = 0,
}) => {
  const renderTheater = () => (
    <div className="p-2 bg-gray-100 rounded-lg border-2 border-dashed">
      <div className="flex justify-center mb-2">
        <div className="w-2/3 h-2 bg-gray-600 rounded-full text-center text-white text-xs">Stage</div>
      </div>
      <div
        className="grid gap-1.5 justify-center"
        style={{ gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: totalRows * totalCols }, (_, i) => <Seat key={i} />)}
      </div>
    </div>
  );

  const renderBanquet = () => (
    <div className="p-2 bg-gray-100 rounded-lg border-2 border-dashed flex flex-wrap justify-center items-center">
      {Array.from({ length: totalTables }, (_, i) => <Table key={i} chairs={chairsPerTable} />)}
    </div>
  );

  const renderFreestyle = () => (
    <div className="p-8 bg-gray-100 rounded-lg border-2 border-dashed flex justify-center items-center">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-700">{standingCapacity}</p>
        <p className="text-sm text-gray-500">Standing Capacity</p>
      </div>
    </div>
  );

  switch (typeName) {
    case 'Theater':
      return renderTheater();
    case 'Banquet':
      return renderBanquet();
    case 'Freestyle':
      return renderFreestyle();
    default:
      return <div className="text-sm text-gray-500">Select a layout type to see a preview.</div>;
  }
};

export default LayoutPreview;
