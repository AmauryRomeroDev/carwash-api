import { Link } from "react-router";
import { Droplets, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function Welcome() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 text-white flex flex-col">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1760827797819-4361cd5cd353?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjB3YXNoJTIwY2xlYW5pbmclMjBzZXJ2aWNlfGVufDF8fHx8MTc3MzY1NzUwOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Car Wash"
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-between px-6 py-12 max-w-md mx-auto w-full">
        {/* Logo and Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1 flex flex-col items-center justify-center text-center"
        >
          <div className="bg-white p-6 rounded-3xl shadow-2xl mb-8">
            <Droplets className="h-20 w-20 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold mb-4">AutoSplash</h1>
          <p className="text-xl text-blue-100 mb-2">Tu Auto, Siempre Impecable</p>
          <p className="text-sm text-blue-200 max-w-xs">
            Servicio profesional de lavado a domicilio
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full space-y-4"
        >
          <Link
            to="/signup"
            className="block w-full bg-white text-blue-600 py-4 rounded-full font-semibold hover:bg-blue-50 transition-all shadow-lg text-center"
          >
            Crear Cuenta
          </Link>
          <Link
            to="/login"
            className="block w-full border-2 border-white text-white py-4 rounded-full font-semibold hover:bg-white/10 transition-all text-center"
          >
            Iniciar Sesión
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
