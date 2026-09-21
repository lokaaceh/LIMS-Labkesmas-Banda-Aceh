import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  LogIn,
  Loader2,
  AlertCircle,
} from "lucide-react";

export function LoginForm({ className, ...props }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const result = await login(formData.username, formData.password);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setErrorMessage(result.message);
      setFormData((prev) => ({ ...prev, password: "" }));
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage("");
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col justify-center p-8 sm:p-12 lg:p-16 relative z-10">
      {/* Tombol Kembali ke Beranda */}
      <Link
        to="/"
        className="
        absolute
        top-8
        left-8
        sm:left-12
        flex
        items-center
        gap-3
        text-slate-700
        hover:text-[#16b3ac]
        transition-all
        font-medium
        text-sm
        group
      "
      >
        <ArrowLeft
          size={15}
          className="transition-transform group-hover:-translate-x-0.5"
        />
        <span>Kembali ke Beranda</span>
      </Link>

      <form
        onSubmit={handleSubmit}
        className={`flex flex-col gap-6 mt-12 lg:mt-4 ${className || ""}`}
        {...props}
      >
        <FieldGroup>
          {/* Header Section */}
          <div className="flex flex-col items-center lg:items-start gap-1 text-center lg:text-left mb-2">
            <img
              src="/logo.svg"
              alt="Labkesmas Logo"
              className="h-13 w-auto mb-4 mx-auto lg:mx-0"
            />
            <h1 className="text-4xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Selamat Datang Kembali
            </h1>
            <p className="text-base text-balance text-muted-foreground">
              Silahkan masukkan kredensial Anda untuk mengakses LIMS BLKM Banda
              Aceh.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <Alert className="bg-red-50/80 backdrop-blur-xs border-red-200 text-red-700  flex items-start gap-3 shadow-xs py-3 px-4">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <AlertDescription className="text-xs font-semibold leading-relaxed">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Input Username */}
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User
                  className={`h-4 w-4 transition-colors ${
                    errorMessage
                      ? "text-red-400"
                      : "text-slate-400 group-focus-within:text-cyan-600"
                  }`}
                />
              </div>
              <Input
                id="username"
                type="text"
                className={`pl-10 h-11 rounded-xl bg-slate-50/60 transition-all ${
                  errorMessage
                    ? "border-red-300 focus-visible:ring-red-500 bg-red-50/25"
                    : "border-slate-200 focus-visible:ring-cyan-500"
                }`}
                placeholder="Masukkan username Anda"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                required
              />
            </div>
          </Field>

          {/* Input Password */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock
                  className={`h-4 w-4 transition-colors ${
                    errorMessage
                      ? "text-red-400"
                      : "text-slate-400 group-focus-within:text-cyan-600"
                  }`}
                />
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`pl-10 pr-10 h-11 rounded-xl bg-slate-50/60 transition-all ${
                  errorMessage
                    ? "border-red-300 focus-visible:ring-red-500 bg-red-50/25"
                    : "border-slate-200 focus-visible:ring-cyan-500"
                }`}
                placeholder="Masukkan password Anda"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>

          {/* Tombol Submit */}
          <Field className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-5 shadow-lg font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Memproses Sesi...
                </>
              ) : (
                <>
                  Masuk Sistem
                  <LogIn className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {/* Footer Copyright */}
            <FieldDescription className="text-xs text-center pt-6 border-t border-slate-100 mt-6">
              &copy; 2026 LIMS BLKM Banda Aceh. <br /> All rights reserved.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
