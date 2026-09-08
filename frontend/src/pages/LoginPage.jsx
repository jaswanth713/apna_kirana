import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogIn, Loader2, AlertCircle, Phone, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/formatters";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim() || !password) {
      setError("Please fill in both phone/email and password");
      return;
    }

    setLoading(true);
    try {
      const user = await login(identifier.trim(), password);
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err, "Invalid login credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-slate-900 font-display">Sign In to Your Account</h3>
        <p className="text-xs text-slate-500">
          Enter your mobile phone number or email address
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Mobile Number or Email
          </label>
          <div className="relative">
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. 9876543210 or user@example.com"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5 text-xs font-bold shadow-md justify-center"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login to Account"}
        </button>
      </form>

      <div className="text-center text-xs text-slate-500">
        Don't have an account?{" "}
        <Link to="/register" state={{ from: location.state?.from }} className="font-bold text-brand-600 hover:underline">
          Register New Account
        </Link>
      </div>
    </div>
  );
}
