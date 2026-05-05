"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

/**
 * Halaman Registrasi
 * - Menyediakan form pembuatan akun baru
 * - Mengirim data ke endpoint `/api/auth/register`
 */
export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "SISWA" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal registrasi");
      }

      alert("✅ Registrasi berhasil! Silakan login.");
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal registrasi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-900 via-blue-800 to-indigo-900">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
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
            />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-600">SMK MUHAMMADIYAH 12</h2>
            <h3 className="text-xs text-gray-500">JAKARTA UTARA</h3>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Registrasi Akun</h1>
          <p className="text-sm text-gray-600 mt-2">Daftar sebagai Pengguna Laboratorium</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
            <input 
              type="text" 
              required
              placeholder="Masukkan nama lengkap"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              placeholder="email@example.com" 
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Peran / Status</label>
            <select 
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition"
            >
              <option value="SISWA">👤 Siswa</option>
              <option value="GURU">👨‍🏫 Guru</option>
              <option value="ADMIN">👨‍💼 Admin</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2 text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
          >
            {loading ? "Memproses..." : "Daftar Akun"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Sudah punya akun?</span>
          </div>
        </div>

        {/* Login Link */}
        <Link 
          href="/login" 
          className="w-full block text-center py-2 text-green-600 border border-green-200 rounded-lg hover:bg-green-50 font-semibold transition"
        >
          Login di sini
        </Link>
      </div>
    </div>
  );
}
