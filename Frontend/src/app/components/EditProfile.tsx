import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { User, Mail, Phone, MapPin, ArrowLeft, Save } from "lucide-react";
import { motion } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";

export function EditProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/");
      return;
    }

    setFormData({
      name: localStorage.getItem("userName") || "",
      email: localStorage.getItem("userEmail") || "",
      phone: localStorage.getItem("userPhone") || "",
      address: localStorage.getItem("userAddress") || "",
    });
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      phone: "",
    };

    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es requerido";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El correo electrónico no es válido";
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    // Simulate API call
    setTimeout(() => {
      localStorage.setItem("userName", formData.name);
      localStorage.setItem("userEmail", formData.email);
      localStorage.setItem("userPhone", formData.phone);
      localStorage.setItem("userAddress", formData.address);

      setIsSaving(false);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        navigate("/profile");
      }, 1500);
    }, 800);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Clear error when user starts typing
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      });
    }
  };

  return (
    <>
      {/* Top Navigation - Desktop Only */}
      <div className="hidden lg:block">
        <TopNav />
      </div>

      <div className="min-h-screen bg-gray-50 lg:pb-8 pb-24">
        {/* Header - Mobile Version */}
        <div className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 pt-12 pb-24 rounded-b-3xl">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 mb-4 text-blue-100 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Volver</span>
            </button>
            <h1 className="text-2xl font-bold mb-2">Editar Perfil</h1>
            <p className="text-blue-100 text-sm">Actualiza tu información personal</p>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 mb-4 text-blue-100 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-lg">Volver al Perfil</span>
            </button>
            <h1 className="text-4xl font-bold mb-4">Editar Perfil</h1>
            <p className="text-xl text-blue-100">Actualiza tu información personal</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 lg:py-8">
          {/* Mobile Form Container */}
          <div className="lg:hidden -mt-16 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border ${
                        errors.name ? "border-red-500" : "border-gray-300"
                      } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="tu@email.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                </div>

                {/* Address Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Tu dirección (opcional)"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`w-full py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                    isSaving
                      ? "bg-gray-400 cursor-not-allowed"
                      : showSuccess
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : showSuccess ? (
                    <>
                      <span>✓ Guardado exitosamente</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>

          {/* Desktop Form */}
          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-4 py-3 border ${
                          errors.name ? "border-red-500" : "border-gray-300"
                        } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-4 py-3 border ${
                          errors.email ? "border-red-500" : "border-gray-300"
                        } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        placeholder="tu@email.com"
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                  </div>
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                </div>

                {/* Address Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Tu dirección (opcional)"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="flex-1 py-4 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`flex-1 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                      isSaving
                        ? "bg-gray-400 cursor-not-allowed"
                        : showSuccess
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    } text-white`}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : showSuccess ? (
                      <>
                        <span>✓ Guardado exitosamente</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        <span>Guardar Cambios</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </>
  );
}
