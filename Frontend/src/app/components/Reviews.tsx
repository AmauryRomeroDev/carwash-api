import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Star, MessageCircle, ThumbsUp, User } from "lucide-react";
import { motion } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";

interface Comment {
  id: number;
  content: string;
  rating: number;
  created_at: string;
  author: {
    id: number;
    name: string;
  };
  service: {
    id: number;
    service_name: string;
  } | null;
  replies: Comment[];
}

interface Service {
  is_active: boolean;
  id: number;
  service_name: string;
}

export function Reviews() {
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showAddReview, setShowAddReview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [newReview, setNewReview] = useState({
    service_id: 0,
    rating: 0,
    content: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    const token = localStorage.getItem("access_token");
    setIsLoading(true);
    
    try {
      // 1. Obtener comentarios
      const commentsResponse = await fetch("http://localhost:8000/api/v1/comments/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!commentsResponse.ok) {
        if (commentsResponse.status === 401) {
          localStorage.clear();
          navigate("/");
          return;
        }
        throw new Error("Error al cargar comentarios");
      }

      const commentsData = await commentsResponse.json();
      setComments(commentsData);

      // 2. Obtener servicios para el selector
      const servicesResponse = await fetch("http://localhost:8000/api/v1/services/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServices(servicesData.filter((s: Service) => s.is_active !== false));
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");

    if (!newReview.service_id || !newReview.rating || !newReview.content) {
      setError("Por favor completa todos los campos");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/v1/comments/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newReview.content,
          rating: newReview.rating,
          service_id: newReview.service_id,
          parent_id: 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al publicar comentario");
      }

      // Recargar comentarios después de publicar
      await fetchData();

      // Reset form
      setNewReview({ service_id: 0, rating: 0, content: "" });
      setShowAddReview(false);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    }
  };

  const handleHelpful = async (commentId: number) => {
    // Nota: El endpoint para "útil" no está implementado en el backend
    // Por ahora solo es visual, pero se puede implementar después
    console.log("Marcar como útil:", commentId);
    // Aquí se podría implementar un endpoint PUT /api/v1/comments/{id}/helpful
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const averageRating = comments.length > 0
    ? (comments.reduce((acc, comment) => acc + comment.rating, 0) / comments.length).toFixed(1)
    : "5.0";

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: comments.filter((c) => c.rating === stars).length,
    percentage: comments.length > 0
      ? (comments.filter((c) => c.rating === stars).length / comments.length) * 100
      : 0,
  }));

  if (isLoading) {
    return (
      <>
        <div className="hidden lg:block sticky top-0 z-50">
          <TopNav />
        </div>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando reseñas...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Top Navigation - Desktop Only */}
      <div className="hidden lg:block sticky top-0 z-50">
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
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">Reseñas y Comentarios</h1>
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
                  <p className="text-sm text-gray-500">{comments.length} reseñas</p>
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
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm">
                  {error}
                </div>
              )}

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
                        value={newReview.service_id}
                        onChange={(e) =>
                          setNewReview({ ...newReview, service_id: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                      >
                        <option value={0}>Selecciona un servicio</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.service_name}
                          </option>
                        ))}
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
                        value={newReview.content}
                        onChange={(e) =>
                          setNewReview({ ...newReview, content: e.target.value })
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
                        onClick={() => {
                          setShowAddReview(false);
                          setError("");
                        }}
                        className="flex-1 py-3 rounded-xl border border-gray-300 font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!newReview.service_id || !newReview.rating || !newReview.content}
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
                {comments.length > 0 ? (
                  comments.map((comment, index) => (
                    <motion.div
                      key={comment.id}
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
                          <h4 className="font-semibold">{comment.author.name}</h4>
                          <p className="text-sm text-gray-500">
                            {formatDate(comment.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(comment.rating)].map((_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 text-yellow-400 fill-current"
                            />
                          ))}
                        </div>
                      </div>

                      {comment.service && (
                        <div className="mb-3">
                          <span className="inline-block bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                            {comment.service.service_name}
                          </span>
                        </div>
                      )}

                      <p className="text-gray-700 mb-4">{comment.content}</p>

                      {/* Mostrar respuestas si existen */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="bg-gray-50 rounded-xl p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">
                                  {reply.author.name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleHelpful(comment.id)}
                          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span>Útil</span>
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
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
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </>
  );
}