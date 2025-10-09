"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/types/layout";
import LayoutPreview from "@/components/previews/LayoutPreview";

interface LayoutFormProps {
  onSubmit: (data: Omit<Layout, "id" | "venueId">) => Promise<void>;
  initialData?: Layout | null;
  venueMaxCapacity: number;
}

const layoutTypes = [
  { name: 'Theater', code: '200' },
  { name: 'Banquet', code: '210' },
  { name: 'Freestyle', code: '220' }
];

const InputField = ({ label, name, value, onChange, required = false, placeholder = '', type = 'text', readOnly = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            readOnly={readOnly}
            className={`w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-gray-900 ${
              readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
        />
    </div>
);

const CheckboxField = ({ label, name, checked, onChange }) => (
    <div className="flex items-center">
        <input
            type="checkbox"
            name={name}
            id={name}
            checked={checked}
            onChange={onChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor={name} className="ml-2 block text-sm text-gray-900">{label}</label>
    </div>
);

const LayoutForm: React.FC<LayoutFormProps> = ({ onSubmit, initialData, venueMaxCapacity }) => {
  const [formData, setFormData] = useState({
    layoutName: "",
    typeCode: layoutTypes[0].code,
    typeName: layoutTypes[0].name,
    totalRows: 0,
    totalCols: 0,
    totalTables: 0,
    chairsPerTable: 0,
    standingCapacity: 0,
    totalCapacity: 0,
    isActive: true,
  });
  const [capacityWarning, setCapacityWarning] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (initialData) {
      setFormData({
        layoutName: initialData.layoutName || "",
        typeCode: initialData.typeCode || layoutTypes[0].code,
        typeName: initialData.typeName || layoutTypes[0].name,
        totalRows: initialData.totalRows || 0,
        totalCols: initialData.totalCols || 0,
        totalTables: initialData.totalTables || 0,
        chairsPerTable: initialData.chairsPerTable || 0,
        standingCapacity: initialData.standingCapacity || 0,
        totalCapacity: initialData.totalCapacity || 0,
        isActive: initialData.isActive ?? true,
      });
    }
  }, [initialData]);

  // Auto-calculate total capacity and check against venue max capacity
  useEffect(() => {
    let capacity = 0;
    if (formData.typeName === 'Theater') {
      capacity = formData.totalRows * formData.totalCols;
    } else if (formData.typeName === 'Banquet') {
      capacity = formData.totalTables * formData.chairsPerTable;
    } else if (formData.typeName === 'Freestyle') {
      capacity = formData.standingCapacity;
    }
    setFormData(prev => ({ ...prev, totalCapacity: capacity }));

    if (venueMaxCapacity > 0 && capacity > venueMaxCapacity) {
      setCapacityWarning(`Warning: Capacity exceeds venue's maximum of ${venueMaxCapacity}.`);
    } else {
      setCapacityWarning("");
    }
  }, [formData.typeName, formData.totalRows, formData.totalCols, formData.totalTables, formData.chairsPerTable, formData.standingCapacity, venueMaxCapacity]);


  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTypeName = e.target.value;
    const selectedType = layoutTypes.find(t => t.name === selectedTypeName);
    if (selectedType) {
      setFormData(prev => ({
        ...prev,
        typeName: selectedType.name,
        typeCode: selectedType.code,
        totalRows: 0,
        totalCols: 0,
        totalTables: 0,
        chairsPerTable: 0,
        standingCapacity: 0,
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (capacityWarning) {
      alert("Cannot save: Layout capacity exceeds venue's maximum capacity.");
      return;
    }
    await onSubmit(formData);
  };

  const selectedLayoutType = layoutTypes.find(t => t.name === formData.typeName);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-8">
        
        {/* Column 1: Basic Info */}
        <div className="space-y-6">
          <h3 className="font-semibold text-lg text-gray-700 mb-4">Basic Information</h3>
          <InputField label="Layout Name" name="layoutName" value={formData.layoutName} onChange={handleChange} required placeholder="e.g., Main Hall, Rooftop Deck" />
          <div>
            <label htmlFor="typeName" className="block text-sm font-medium text-gray-700 mb-1">Layout Type</label>
            <select
                name="typeName"
                id="typeName"
                value={formData.typeName}
                onChange={handleTypeChange}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
                {layoutTypes.map(type => <option key={type.code} value={type.name}>{type.name}</option>)}
            </select>
          </div>
          <div>
            <InputField label="Total Capacity" name="totalCapacity" value={formData.totalCapacity} onChange={() => {}} required type="number" readOnly />
            {capacityWarning && <p className="text-sm text-red-600 mt-1">{capacityWarning}</p>}
          </div>
          <CheckboxField label="Active" name="isActive" checked={formData.isActive} onChange={handleChange} />
        </div>

        {/* Column 2: Configuration */}
        <div className="space-y-6 p-6 bg-gray-50 rounded-lg border">
            <h3 className="font-semibold text-lg text-gray-700 mb-4">Detailed Configuration</h3>
            {selectedLayoutType?.name === 'Theater' && (
              <>
                <InputField label="Rows" name="totalRows" value={formData.totalRows} onChange={handleChange} type="number" />
                <InputField label="Columns" name="totalCols" value={formData.totalCols} onChange={handleChange} type="number" />
              </>
            )}
            {selectedLayoutType?.name === 'Banquet' && (
              <>
                <InputField label="Tables" name="totalTables" value={formData.totalTables} onChange={handleChange} type="number" />
                <InputField label="Chairs Per Table" name="chairsPerTable" value={formData.chairsPerTable} onChange={handleChange} type="number" />
              </>
            )}
            {selectedLayoutType?.name === 'Freestyle' && (
              <>
                <InputField label="Standing Capacity" name="standingCapacity" value={formData.standingCapacity} onChange={handleChange} type="number" />
              </>
            )}
        </div>

        {/* Column 3: Preview */}
        <div className="space-y-6 p-6 bg-gray-50 rounded-lg border">
          <h3 className="font-semibold text-lg text-gray-700 mb-4">Preview</h3>
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <LayoutPreview {...formData} />
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-gray-200">
        <div className="flex justify-end">
            <button type="button" onClick={() => router.back()} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg mr-4">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={!!capacityWarning}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {initialData ? "Update Layout" : "Save Layout"}
            </button>
        </div>
      </div>
    </form>
  );
};

export default LayoutForm;
