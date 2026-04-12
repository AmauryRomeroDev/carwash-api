import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Star, MessageCircle, ThumbsUp, User } from "lucide-react";
import { motion } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  service: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

export function Reviews() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReview, setNewReview] = useState({
    service: "",
    rating: 0,
    comment: "",
  });

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/");
      return;
    }

    // Load reviews from localStorage
    const savedReviews = localStorage.getItem("reviews");
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    } else {
      // Initial mock reviews
      const initialReviews: Review[] = [
        {
          id: "1",
          userName: "Carlos Mendoza",
          service: "Lavado Premium",
          rating: 5,
          comment:
            "Excelente servicio! Mi auto quedó impecable. El equipo fue muy profesional y rápido. Definitivamente volveré.",
          date: "20 Mar 2026",
          helpful: 12,
        },
        {
          id: "2",
          userName: "María González",
          service: "Detallado Completo",
          rating: 5,
          comment:
            "Increíble trabajo con el detallado. Mi auto de 5 años parece nuevo. Vale cada centavo. Muy recomendado!",
          date: "18 Mar 2026",
          helpful: 8,
        },
        {
          id: "3",
          userName: "Jorge Ramírez",
          service: "Lavado Básico",
          rating: 4,
          comment:
            "Buen servicio y precio justo. El lavado fue rápido y eficiente. Solo le faltó un poco más de atención en las llantas.",
          date: "15 Mar 2026",
          helpful: 5,
        },
        {
          id: "4",
          userName: "Ana Martínez",
          service: "Pulido y Encerado",
          rating: 5,
          comment:
            "El pulido dejó mi auto brillante como nunca. Excelente atención al detalle y servicio a domicilio muy conveniente.",
          date: "12 Mar 2026",
          helpful: 15,
        },
        {
          id: "5",
          userName: "Roberto Silva",
          service: "Lavado Premium",
          rating: 5,
          comment:
            "Primera vez usando AutoSplash y quedé impresionado. Servicio rápido, profesional y muy amables. 100% recomendado!",
          date: "10 Mar 2026",
          helpful: 6,
        },
      ];
      setReviews(initialReviews);
      localStorage.setItem("reviews", JSON.stringify(initialReviews));
    }
  }, [navigate]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    const userName = localStorage.getItem("userName") || "Usuario";
    const newReviewData: Review = {
      id: Date.now().toString(),
      userName,
      service: newReview.service,
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      helpful: 0,
    };

    const updatedReviews = [newReviewData, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem("reviews", JSON.stringify(updatedReviews));

    // Reset form
    setNewReview({ service: "", rating: 0, comment: "" });
    setShowAddReview(false);
  };

  const handleHelpful = (reviewId: string) => {
    const updatedReviews = reviews.map((review) =>
      review.id === reviewId
        ? { ...review, helpful: review.helpful + 1 }
        : review
    );
    setReviews(updatedReviews);
    localStorage.setItem("reviews", JSON.stringify(updatedReviews));
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
    percentage: reviews.length > 0
      ? (reviews.filter((r) => r.rating === stars).length / reviews.length) * 100
      : 0,
  }));

  return (
    <>
      {/* Top Navigation - Desktop Only */}
      <div className="hidden lg:block">
        <TopNav />
      </div>

      <div className="min-h-screen bg-gray-50 lg:pb-8 pb-24">
        {/* Header */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 lg:py-12 pt-12 pb-8 lg:rounded-none rounded-b-3xl">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl lg:text-4xl mb-4">Reseñas y Comentarios</h1>
              <p className="text-blue-100 lg:text-lg">
                Lo que dicen nuestros clientes
              </p>
            </motion.div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 py-6 lg:py-8">
          {/* Desktop Grid Layout */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-6">
            {/* Left Column - Rating Summary (Sticky on Desktop) */}
            <div className="lg:col-span-1">
              {/* Overall Rating */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 lg:sticky lg:top-24">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    {averageRating}
                  </div>
                  <div className="flex justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.round(parseFloat(averageRating))
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">{reviews.length} reseñas</p>
                </div>

                <div className="space-y-2 mb-6">
                  {ratingDistribution.map((dist) => (
                    <div key={dist.stars} className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 w-3">{dist.stars}</span>
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${dist.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-8">
                        {dist.count}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowAddReview(!showAddReview)}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  Escribir una reseña
                </button>
              </div>
            </div>

            {/* Right Column - Reviews List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Add Review Form */}
              {showAddReview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <h3 className="text-lg font-semibold mb-4">
                    Comparte tu experiencia
                  </h3>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Servicio
                      </label>
                      <select
                        value={newReview.service}
                        onChange={(e) =>
                          setNewReview({ ...newReview, service: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                      >
                        <option value="">Selecciona un servicio</option>
                        <option value="Lavado Básico">Lavado Básico</option>
                        <option value="Lavado Premium">Lavado Premium</option>
                        <option value="Detallado Interior">Detallado Interior</option>
                        <option value="Pulido y Encerado">Pulido y Encerado</option>
                        <option value="Limpieza de Motor">Limpieza de Motor</option>
                        <option value="Detallado Completo">Detallado Completo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Calificación
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              setNewReview({ ...newReview, rating: star })
                            }
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-8 w-8 ${
                                star <= newReview.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comentario
                      </label>
                      <textarea
                        value={newReview.comment}
                        onChange={(e) =>
                          setNewReview({ ...newReview, comment: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                        rows={4}
                        placeholder="Cuéntanos sobre tu experiencia..."
                        required
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowAddReview(false)}
                        className="flex-1 py-3 rounded-xl border border-gray-300 font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!newReview.service || !newReview.rating || !newReview.comment}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Publicar
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-sm p-6"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{review.userName}</h4>
                        <p className="text-sm text-gray-500">{review.date}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 text-yellow-400 fill-current"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <span className="inline-block bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                        {review.service}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4">{review.comment}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleHelpful(review.id)}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>Útil ({review.helpful})</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {reviews.length === 0 && !showAddReview && (
                <div className="text-center py-12 bg-white rounded-2xl">
                  <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    Aún no hay reseñas. ¡Sé el primero en compartir tu experiencia!
                  </p>
                </div>
              )}
            </div>
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