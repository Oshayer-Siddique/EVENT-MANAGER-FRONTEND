"use client";
import { useEffect, useState } from "react";

export default function TestBackendConnection() {
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const testBackend = async () => {
      try {
        const res = await fetch("http://localhost:5010/api/test/ok", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.text(); // or res.json() if backend returns JSON
        setMessage(data);
      } catch (err: any) {
        setMessage(`Connection failed: ${err.message}`);
      }
    };

    testBackend();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Backend Connection Test</h1>
      <p className="text-gray-700">{message || "Testing..."}</p>
    </div>
  );
}
