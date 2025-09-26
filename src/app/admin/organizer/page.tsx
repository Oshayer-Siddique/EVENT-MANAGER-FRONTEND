"use client";
import { Settings } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center h-full flex flex-col justify-center items-center">
            <Settings className="w-16 h-16 text-indigo-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Organization Settings</h2>
            <p className="text-gray-500">Manage your organization's profile and settings here.</p>
        </div>
    );
}