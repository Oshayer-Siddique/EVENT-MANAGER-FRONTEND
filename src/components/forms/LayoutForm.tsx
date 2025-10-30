"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import LayoutPreview from "@/components/previews/LayoutPreview";
import { Layout } from "@/types/layout";

import TheaterLayoutDesigner, {
  buildSummary,
  createDefaultState,
  createStateFromDimensions,
} from "./TheaterLayoutDesigner";
import type { TheaterDesignerState, TheaterPlanSummary, TheaterLayoutConfiguration } from "@/types/theaterPlan";

export interface LayoutFormSubmitData {
  layout: Omit<Layout, "id" | "venueId">;
  theaterPlan?: TheaterPlanSummary;
  configuration?: TheaterLayoutConfiguration | null;
}

interface LayoutFormProps {
  onSubmit: (data: LayoutFormSubmitData) => Promise<void>;
  initialData?: Layout | null;
  venueMaxCapacity: number;
}

const layoutTypes = [
  { name: "Theater", code: "200" },
  { name: "Seminar", code: "205" },
  { name: "Conference Hall", code: "206" },
  { name: "Banquet", code: "210" },
  { name: "Freestyle", code: "220" },
];

const theaterLikeTypes = new Set(["Theater", "Seminar", "Conference Hall"]);

const InputField = ({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder = "",
  type = "text",
  readOnly = false,
}) => (
  <div>
    <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      type={type}
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        readOnly ? "cursor-not-allowed bg-gray-100" : ""
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
      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    />
    <label htmlFor={name} className="ml-2 block text-sm text-gray-900">
      {label}
    </label>
  </div>
);

const LayoutForm: React.FC<LayoutFormProps> = ({ onSubmit, initialData, venueMaxCapacity }) => {
  const router = useRouter();

  const [designerDefaults] = useState(() => {
    const state = createDefaultState();
    return { state, summary: buildSummary(state) };
  });
  const [theaterState, setTheaterState] = useState<TheaterDesignerState>(designerDefaults.state);
  const [theaterPlan, setTheaterPlan] = useState<TheaterPlanSummary>(designerDefaults.summary);
  const [designerSeed, setDesignerSeed] = useState<TheaterDesignerState | undefined>(undefined);

  const [formData, setFormData] = useState({
    layoutName: "",
    typeCode: layoutTypes[0].code,
    typeName: layoutTypes[0].name,
    totalRows: theaterPlan.rows.filter((row) => row.activeSeatCount > 0).length,
    totalCols: theaterPlan.columns,
    totalTables: 0,
    chairsPerTable: 0,
    standingCapacity: 0,
    totalCapacity: theaterPlan.capacity,
    isActive: true,
  });
  const [capacityWarning, setCapacityWarning] = useState("");

  useEffect(() => {
    if (!initialData) {
      return;
    }

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

    if (initialData.typeName && theaterLikeTypes.has(initialData.typeName)) {
      if (initialData.configuration && initialData.configuration.kind === "theater") {
        const stateFromConfig = initialData.configuration.state;
        const summaryFromConfig = initialData.configuration.summary ?? buildSummary(initialData.configuration.state);
        setTheaterState(stateFromConfig);
        setTheaterPlan(summaryFromConfig);
        setDesignerSeed(stateFromConfig);
      } else {
        const defaultSeatRows = designerDefaults.summary.rows.filter((row) => row.activeSeatCount > 0).length || 1;
        const defaultCols = designerDefaults.summary.columns || 1;
        const rows = Math.max(1, initialData.totalRows || defaultSeatRows);
        const cols = Math.max(1, initialData.totalCols || defaultCols);

        const nextState = createStateFromDimensions(rows, cols, designerDefaults.state.sections);
        setTheaterState(nextState);
        setTheaterPlan(buildSummary(nextState));
        setDesignerSeed(nextState);
      }
    } else {
      setDesignerSeed(undefined);
    }
  }, [designerDefaults.state.sections, designerDefaults.summary.columns, designerDefaults.summary.rows, initialData]);

  const activeSeatRowCount = theaterPlan.rows.filter((row) => !row.isWalkway && row.activeSeatCount > 0).length;

  useEffect(() => {
    if (theaterLikeTypes.has(formData.typeName)) {
      const capacity = theaterPlan.capacity;
      const rows = activeSeatRowCount;
      const cols = theaterPlan.columns;

      setFormData((prev) => {
        if (
          prev.totalCapacity === capacity &&
          prev.totalRows === rows &&
          prev.totalCols === cols
        ) {
          return prev;
        }
        return {
          ...prev,
          totalCapacity: capacity,
          totalRows: rows,
          totalCols: cols,
          totalTables: 0,
          chairsPerTable: 0,
          standingCapacity: 0,
        };
      });

      if (venueMaxCapacity > 0 && capacity > venueMaxCapacity) {
        setCapacityWarning(`Warning: Capacity exceeds venue's maximum of ${venueMaxCapacity}.`);
      } else {
        setCapacityWarning("");
      }

      return;
    }

    let capacity = 0;
    if (formData.typeName === "Banquet") {
      capacity = formData.totalTables * formData.chairsPerTable;
    } else if (formData.typeName === "Freestyle") {
      capacity = formData.standingCapacity;
    }

    setFormData((prev) => (prev.totalCapacity === capacity ? prev : { ...prev, totalCapacity: capacity }));

    if (venueMaxCapacity > 0 && capacity > venueMaxCapacity) {
      setCapacityWarning(`Warning: Capacity exceeds venue's maximum of ${venueMaxCapacity}.`);
    } else {
      setCapacityWarning("");
    }
  }, [
    formData.typeName,
    formData.totalTables,
    formData.chairsPerTable,
    formData.standingCapacity,
    theaterPlan.capacity,
    theaterPlan.columns,
    activeSeatRowCount,
    venueMaxCapacity,
  ]);

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTypeName = event.target.value;
    const selectedType = layoutTypes.find((type) => type.name === selectedTypeName);
    if (!selectedType) {
      return;
    }

    setCapacityWarning("");
    setFormData((prev) => ({
      ...prev,
      typeName: selectedType.name,
      typeCode: selectedType.code,
      totalRows: theaterPlan.rows.filter((row) => row.activeSeatCount > 0).length,
      totalCols: theaterPlan.columns,
      totalTables: 0,
      chairsPerTable: 0,
      standingCapacity: 0,
      totalCapacity: theaterLikeTypes.has(selectedType.name) ? theaterPlan.capacity : 0,
    }));

    const wasTheaterLike = theaterLikeTypes.has(formData.typeName);
    const willBeTheaterLike = theaterLikeTypes.has(selectedType.name);

    if (!wasTheaterLike && willBeTheaterLike) {
      const seed = createDefaultState();
      setDesignerSeed(seed);
      setTheaterState(seed);
      setTheaterPlan(buildSummary(seed));
    } else if (!willBeTheaterLike) {
      setDesignerSeed(undefined);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleDesignerChange = useCallback(
    (state: TheaterDesignerState, summary: TheaterPlanSummary) => {
      setTheaterState(state);
      setTheaterPlan(summary);
    },
    [],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (capacityWarning) {
      alert("Cannot save: Layout capacity exceeds venue's maximum capacity.");
      return;
    }

    const isTheaterLayout = theaterLikeTypes.has(formData.typeName);

    if (isTheaterLayout && theaterPlan.capacity === 0) {
      alert("Please configure at least one seat for this layout.");
      return;
    }

    const configuration: TheaterLayoutConfiguration | null = isTheaterLayout
      ? { kind: "theater", state: theaterState, summary: theaterPlan }
      : null;

    const payload: Omit<Layout, "id" | "venueId"> = {
      ...formData,
      totalRows: isTheaterLayout ? theaterPlan.rows.filter((row) => row.activeSeatCount > 0).length : formData.totalRows,
      totalCols: isTheaterLayout ? theaterPlan.columns : formData.totalCols,
      totalCapacity: isTheaterLayout ? theaterPlan.capacity : formData.totalCapacity,
      configuration,
    };

    await onSubmit({
      layout: payload,
      theaterPlan: isTheaterLayout ? theaterPlan : undefined,
      configuration,
    });
  };

  const selectedLayoutType = layoutTypes.find((type) => type.name === formData.typeName);
  const isTheaterLayout = theaterLikeTypes.has(formData.typeName);

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">Basic Information</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-1">
              <InputField
                label="Layout Name"
                name="layoutName"
                value={formData.layoutName}
                onChange={handleChange}
                required
                placeholder="e.g., Orchestra Level, VIP Deck"
              />
            </div>
            <div>
              <label htmlFor="typeName" className="mb-1 block text-sm font-medium text-gray-700">
                Layout Type
              </label>
              <select
                name="typeName"
                id="typeName"
                value={formData.typeName}
                onChange={handleTypeChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {layoutTypes.map((type) => (
                  <option key={type.code} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <InputField
                label="Total Capacity"
                name="totalCapacity"
                value={isTheaterLayout ? theaterPlan.capacity : formData.totalCapacity}
                onChange={() => {}}
                required
                type="number"
                readOnly
              />
              {capacityWarning ? (
                <p className="mt-1 text-sm text-red-600">{capacityWarning}</p>
              ) : null}
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <CheckboxField label="Active" name="isActive" checked={formData.isActive} onChange={handleChange} />
            </div>
          </div>
        </div>

        {!isTheaterLayout && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">Detailed Configuration</h3>
              {selectedLayoutType?.name === "Banquet" && (
                <>
                  <InputField
                    label="Tables"
                    name="totalTables"
                    value={formData.totalTables}
                    onChange={handleChange}
                    type="number"
                  />
                  <InputField
                    label="Chairs Per Table"
                    name="chairsPerTable"
                    value={formData.chairsPerTable}
                    onChange={handleChange}
                    type="number"
                  />
                </>
              )}
              {selectedLayoutType?.name === "Freestyle" && (
                <InputField
                  label="Standing Capacity"
                  name="standingCapacity"
                  value={formData.standingCapacity}
                  onChange={handleChange}
                  type="number"
                />
              )}
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-700">Preview</h3>
              <div className="flex min-h-[240px] items-center justify-center">
                <LayoutPreview {...formData} />
              </div>
            </div>
          </div>
        )}
      </div>

      {isTheaterLayout ? (
        <TheaterLayoutDesigner
          value={designerSeed}
          onInitialized={() => setDesignerSeed(undefined)}
          onChange={handleDesignerChange}
          venueMaxCapacity={venueMaxCapacity}
        />
      ) : null}

      <div className="border-t border-gray-200 pt-8">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="mr-4 rounded-lg bg-gray-200 px-6 py-2 font-bold text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!!capacityWarning}
            className="rounded-lg bg-blue-600 px-6 py-2 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {initialData ? "Update Layout" : "Save Layout"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default LayoutForm;
