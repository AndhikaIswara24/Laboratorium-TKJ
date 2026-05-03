"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function Login() {
  const router = useRouter();
  const { status } = useSession();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-2xl relative z-10">
        {/* Logo Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Image 
              src="/Logo.webp" 
              alt="Logo SMK Muhammadiyah 12" 
              width={120} 
              height={120}
              className="w-28 h-28"
              priority
            />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-600">SMK MUHAMMADIYAH 12</h2>
            <h3 className="text-xs text-gray-500">JAKARTA UTARA</h3>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Login Laboratorium</h1>
          <p className="text-sm text-gray-600 mt-2">Sistem Manajemen Laboratorium TKJ</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              placeholder="email@example.com" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition" 
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition" 
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Belum punya akun?</span>
          </div>
        </div>

        {/* Register Link */}
        <Link 
          href="/register" 
          className="w-full block text-center py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 font-semibold transition"
        >
          Daftar di sini
        </Link>
      </div>
    </div>
  );
}
