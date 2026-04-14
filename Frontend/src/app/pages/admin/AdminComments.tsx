import { useState, useEffect } from "react";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Trash2,
  X,
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  Archive,
  RotateCcw,
  Reply,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TopNav } from "../../components/TopNav";
import { BottomNav } from "../../components/BottomNav";

interface Comment {
  id: number;
  content: string;
  rating: number;
  created_at: string;
  author: {
    id: number;
    name: string;
    email?: string;
  };
  service: {
    id: number;
    service_name: string;
  } | null;
  replies: Comment[];
  is_approved: boolean;
  is_active: boolean;
}

export function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "deleted" | "all">("pending");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showReplyForm, setShowReplyForm] = useState<number | null>(null);
  const [isReplying, setIsReplying] = useState(false);

  const getToken = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("No hay token en localStorage");
      return null;
    }
    return token;
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      setError("Sesión no iniciada. Por favor, inicia sesión nuevamente.");
      setTimeout(() => {
        localStorage.clear();
        window.location.href = "/";
      }, 2000);
      return;
    }
    fetchComments();
  }, []);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(""), 3000);
  };

  const extractErrorMessage = (errorData: any): string => {
    if (!errorData) return "Error desconocido";
    
    if (typeof errorData === 'string') return errorData;
    
    if (errorData.detail) {
      if (typeof errorData.detail === 'string') return errorData.detail;
      if (Array.isArray(errorData.detail)) {
        return errorData.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
      }
      if (typeof errorData.detail === 'object') {
        return JSON.stringify(errorData.detail);
      }
    }
    
    if (errorData.message) return errorData.message;
    
    return "Error al procesar la solicitud";
  };

  const fetchComments = async () => {
    const token = getToken();
    
    if (!token) {
      setIsLoading(false);
      setError("No hay token de autenticación");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/v1/comments/admin", {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (res.ok) {
        const data = await res.json();
        setComments(data);
      } else if (res.status === 401) {
        localStorage.clear();
        setError("Sesión expirada. Redirigiendo al login...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else if (res.status === 403) {
        setError("No tienes permisos de administrador para ver esta página");
        setTimeout(() => {
          window.location.href = "/home";
        }, 2000);
      } else {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData));
      }
    } catch (err) {
      console.error("Error en fetchComments:", err);
      showError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    const token = getToken();
    if (!token) {
      showError("No hay token de autenticación");
      return;
    }
    setProcessingId(id);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/comments/${id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        await fetchComments();
        showSuccess("Comentario aprobado exitosamente");
        if (selectedComment?.id === id) {
          setSelectedComment(null);
        }
      } else if (res.status === 401) {
        localStorage.clear();
        window.location.href = "/";
      } else {
        const errorData = await res.json();
        showError(extractErrorMessage(errorData));
      }
    } catch (error) {
      showError("Error de conexión");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    const token = getToken();
    if (!token) {
      showError("No hay token de autenticación");
      return;
    }
    setProcessingId(id);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/comments/${id}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        await fetchComments();
        showSuccess("Comentario rechazado");
        if (selectedComment?.id === id) {
          setSelectedComment(null);
        }
      } else if (res.status === 401) {
        localStorage.clear();
        window.location.href = "/";
      } else {
        const errorData = await res.json();
        showError(extractErrorMessage(errorData));
      }
    } catch (error) {
      showError("Error de conexión");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRestore = async (id: number) => {
    const token = getToken();
    if (!token) {
      showError("No hay token de autenticación");
      return;
    }
    setProcessingId(id);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/comments/${id}/restore`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        await fetchComments();
        showSuccess("Comentario restaurado exitosamente");
        if (selectedComment?.id === id) {
          setSelectedComment(null);
        }
      } else if (res.status === 401) {
        localStorage.clear();
        window.location.href = "/";
      } else {
        const errorData = await res.json();
        showError(extractErrorMessage(errorData));
      }
    } catch (error) {
      showError("Error de conexión");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    const token = getToken();
    if (!token) {
      showError("No hay token de autenticación");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/v1/comments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await fetchComments();
        setSelectedComment(null);
        showSuccess("Comentario eliminado exitosamente");
      } else if (res.status === 401) {
        localStorage.clear();
        window.location.href = "/";
      } else {
        const errorData = await res.json();
        showError(extractErrorMessage(errorData));
      }
    } catch (error) {
      showError("Error de conexión");
    }
  };

  const handleReply = async (parentId: number, serviceId?: number) => {
    if (!replyContent.trim()) {
      showError("Por favor escribe una respuesta");
      return;
    }

    const token = getToken();
    if (!token) {
      showError("No hay token de autenticación");
      return;
    }
    setIsReplying(true);

    try {
      const replyData = {
        content: replyContent,
        service_id: serviceId || 0,
        rating: 0,
        parent_id: parentId,
      };

      const res = await fetch("http://localhost:8000/api/v1/comments/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(replyData),
      });

      if (res.ok) {
        await fetchComments();
        setReplyContent("");
        setShowReplyForm(null);
        showSuccess("Respuesta publicada exitosamente");
      } else if (res.status === 401) {
        localStorage.clear();
        window.location.href = "/";
      } else {
        const errorData = await res.json();
        showError(extractErrorMessage(errorData));
      }
    } catch (error) {
      showError("Error de conexión");
    } finally {
      setIsReplying(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingComments = comments.filter(c => !c.is_approved && c.is_active);
  const approvedComments = comments.filter(c => c.is_approved && c.is_active);
  const deletedComments = comments.filter(c => !c.is_active);

  const getDisplayedComments = () => {
    switch (activeTab) {
      case "pending":
        return pendingComments;
      case "approved":
        return approvedComments;
      case "deleted":
        return deletedComments;
      default:
        return comments;
    }
  };

  const stats = {
    total: comments.length,
    pending: pendingComments.length,
    approved: approvedComments.length,
    deleted: deletedComments.length,
  };

  const averageRating =
    approvedComments.length > 0
      ? approvedComments.reduce((sum, c) => sum + c.rating, 0) / approvedComments.length
      : 0;

  if (isLoading)
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="hidden lg:block sticky top-0 z-50">
          <TopNav />
        </div>
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-500">Cargando comentarios...</p>
        </div>
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      <div className="hidden lg:block sticky top-0 z-50">
        <TopNav />
      </div>

      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Gestión de Comentarios
          </h1>
          <p className="text-gray-500 mt-1">
            Modera y gestiona las reseñas de clientes
          </p>
        </div>

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div 
            className={`bg-white rounded-xl p-6 shadow-md cursor-pointer transition-all hover:scale-105 ${
              activeTab === "all" ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setActiveTab("all")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MessageSquare className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </div>

          <div 
            className={`bg-white rounded-xl p-6 shadow-md cursor-pointer transition-all hover:scale-105 ${
              activeTab === "pending" ? "ring-2 ring-amber-500" : ""
            }`}
            onClick={() => setActiveTab("pending")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-amber-500 opacity-50" />
            </div>
          </div>

          <div 
            className={`bg-white rounded-xl p-6 shadow-md cursor-pointer transition-all hover:scale-105 ${
              activeTab === "approved" ? "ring-2 ring-green-500" : ""
            }`}
            onClick={() => setActiveTab("approved")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Aprobados</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </div>

          <div 
            className={`bg-white rounded-xl p-6 shadow-md cursor-pointer transition-all hover:scale-105 ${
              activeTab === "deleted" ? "ring-2 ring-red-500" : ""
            }`}
            onClick={() => setActiveTab("deleted")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Eliminados</p>
                <p className="text-3xl font-bold text-red-600">{stats.deleted}</p>
              </div>
              <Archive className="w-10 h-10 text-red-500 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl p-6 shadow-md">
            <p className="text-sm mb-1 opacity-90">Promedio</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold">{averageRating.toFixed(1)}</p>
              <Star className="w-6 h-6 fill-white" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {getDisplayedComments().length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-sm">
              {activeTab === "pending" ? (
                <>
                  <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay comentarios pendientes</p>
                </>
              ) : activeTab === "approved" ? (
                <>
                  <Star className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay comentarios aprobados</p>
                </>
              ) : activeTab === "deleted" ? (
                <>
                  <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay comentarios eliminados</p>
                </>
              ) : (
                <>
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay comentarios</p>
                </>
              )}
            </div>
          ) : (
            getDisplayedComments().map((comment) => {
              const isPending = !comment.is_approved && comment.is_active;
              const isDeleted = !comment.is_active;
              const isProcessing = processingId === comment.id;
              
              return (
                <div
                  key={comment.id}
                  className={`bg-white rounded-2xl p-6 transition-all hover:shadow-lg border ${
                    isPending ? "border-amber-200 bg-amber-50/30" :
                    isDeleted ? "border-red-200 bg-red-50/30 opacity-75" :
                    "border-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">
                        {comment.author.name}
                      </p>
                      {renderStars(comment.rating)}
                    </div>
                    {isPending ? (
                      <span className="inline-block text-xs px-3 py-1 rounded-full font-medium bg-amber-100 text-amber-700">
                        Pendiente
                      </span>
                    ) : isDeleted ? (
                      <span className="inline-block text-xs px-3 py-1 rounded-full font-medium bg-red-100 text-red-700">
                        Eliminado
                      </span>
                    ) : (
                      <span className="inline-block text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-700">
                        Aprobado
                      </span>
                    )}
                  </div>

                  {comment.service && (
                    <p className="text-xs text-gray-500 mb-2">
                      Servicio: {comment.service.service_name}
                    </p>
                  )}

                  <p className="mb-4 line-clamp-3 text-sm text-gray-600">
                    {comment.content}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <span>{formatDate(comment.created_at)}</span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedComment(comment)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Ver</span>
                    </button>
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleApprove(comment.id)}
                          disabled={isProcessing}
                          className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                          title="Aprobar"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <ThumbsUp className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(comment.id)}
                          disabled={isProcessing}
                          className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                          title="Rechazar"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <ThumbsDown className="w-5 h-5" />
                          )}
                        </button>
                      </>
                    )}
                    {isDeleted && (
                      <button
                        onClick={() => handleRestore(comment.id)}
                        disabled={isProcessing}
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        title="Restaurar"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-5 h-5" />
                        )}
                      </button>
                    )}
                    {!isDeleted && (
                      <button
                        onClick={() => setShowReplyForm(showReplyForm === comment.id ? null : comment.id)}
                        className="p-2 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                        title="Responder"
                      >
                        <Reply className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {showReplyForm === comment.id && !isDeleted && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Escribe una respuesta..."
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleReply(comment.id, comment.service?.id)}
                          disabled={isReplying}
                          className="flex-1 bg-purple-600 text-white py-2 rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isReplying ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Send className="w-5 h-5" />
                          )}
                          Publicar respuesta
                        </button>
                        <button
                          onClick={() => {
                            setShowReplyForm(null);
                            setReplyContent("");
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedComment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Detalle del Comentario
                </h2>
                <button
                  onClick={() => setSelectedComment(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Cliente</h3>
                  <p className="text-gray-600">{selectedComment.author.name}</p>
                </div>

                {selectedComment.service && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Servicio
                    </h3>
                    <p className="text-gray-600">
                      {selectedComment.service.service_name}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Calificación
                  </h3>
                  {renderStars(selectedComment.rating)}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Comentario
                  </h3>
                  <p className="p-4 bg-gray-50 rounded-xl text-gray-600">
                    {selectedComment.content}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Fecha</h4>
                  <p className="text-gray-600">
                    {formatDate(selectedComment.created_at)}
                  </p>
                </div>

                {selectedComment.replies && selectedComment.replies.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Respuestas
                    </h3>
                    <div className="space-y-3">
                      {selectedComment.replies.map((reply) => (
                        <div key={reply.id} className="p-4 bg-gray-50 rounded-xl">
                          <p className="font-medium text-gray-900">
                            {reply.author.name}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {reply.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDate(reply.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex gap-3 flex-wrap">
                    {!selectedComment.is_approved && selectedComment.is_active && (
                      <>
                        <button
                          onClick={() => handleApprove(selectedComment.id)}
                          className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <ThumbsUp className="w-5 h-5" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleReject(selectedComment.id)}
                          className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <ThumbsDown className="w-5 h-5" />
                          Rechazar
                        </button>
                      </>
                    )}
                    {!selectedComment.is_active && (
                      <button
                        onClick={() => handleRestore(selectedComment.id)}
                        className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-5 h-5" />
                        Restaurar
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(selectedComment.id)}
                      className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
                    >
                      Eliminar Comentario
                    </button>
                    <button
                      onClick={() => setSelectedComment(null)}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}