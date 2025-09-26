"use client";
import { useState } from "react";
import { signUp } from "@/services/authService";
import Link from "next/link";
import Image from "next/image";

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Assuming signUp service can handle { username, email, password }
      // You may need to adjust this based on your actual API endpoint
      const response = await signUp({ fullName: username, email, password, phone: "" });
      console.log("Signup response:", response);
      setSuccess("Signup successful! Please check your email to verify your account.");
    } catch (err: any) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="flex flex-col md:flex-row rounded-2xl shadow-lg max-w-5xl bg-white border border-gray-200">
        {/* Form Section */}
        <div className="w-full md:w-1/2 p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Sign Up</h1>
          <p className="text-gray-600 mb-8">Hello! Let's join with us.</p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100              text-gray-800 placeholder-gray-500 
 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100              text-gray-800 placeholder-gray-500 
 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
            />
            <input
              type="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100               text-gray-800 placeholder-gray-500 
focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
            />

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {success && <p className="text-green-500 text-sm text-center">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 text-white bg-teal-600 hover:bg-teal-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/signin" className="font-medium text-teal-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        {/* Image Section */}
        <div className="hidden md:flex w-1/2 items-center justify-center p-6">
<div className="p-[4px] rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500">
  <Image
    src="/pictures/image.png"
    alt="Sign Up Illustration"
    width={400}
    height={400}
    className="object-cover rounded-xl"
  />
</div>


        </div>
      </div>
    </div>
  );
}