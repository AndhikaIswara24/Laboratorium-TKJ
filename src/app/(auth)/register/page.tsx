"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ADMIN" });
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

      alert("Registrasi berhasil! Silakan login.");
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-3 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center">Registrasi Akun Baru</h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium">Nama Lengkap</label>
            <input 
              type="text" 
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-2 border rounded-md" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input 
              type="email" 
              placeholder="email@example.com" 
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-2 border rounded-md" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input 
              type="password" 
              placeholder="******" 
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-2 border rounded-md" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Role</label>
            <select 
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="ADMIN">Admin</option>
              <option value="GURU">Guru</option>
              <option value="SISWA">Siswa</option>
            </select>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Daftar"}
          </button>
        </form>
        <p className="text-sm text-center">
          Sudah punya akun? <Link href="/login" className="text-blue-600 hover:underline">Login di sini</Link>
        </p>
      </div>
    </div>
  );
}
