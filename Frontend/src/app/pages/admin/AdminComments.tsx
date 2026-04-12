import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Eye, Trash2, X, MessageSquare, TrendingUp } from 'lucide-react';
import {
  getComments,
  approveComment,
  rejectComment,
  deleteComment,
  getAverageRating,
  Comment
} from '../../../utils/comments';

export function AdminComments() {
  const [comments, setComments] = useState<Comment[]>(getComments());
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const handleApprove = (id: string) => {
    approveComment(id);
    setComments(getComments());
    if (selectedComment?.id === id) {
      setSelectedComment({ ...selectedComment, status: 'approved', isPublic: true });
    }
  };

  const handleReject = (id: string) => {
    rejectComment(id);
    setComments(getComments());
    if (selectedComment?.id === id) {
      setSelectedComment({ ...selectedComment, status: 'rejected', isPublic: false });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este comentario?')) {
      deleteComment(id);
      setComments(getComments());
      setSelectedComment(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredComments = filter === 'all'
    ? comments
    : comments.filter(c => c.status === filter);

  const stats = [
    { label: 'Total', value: comments.length, filter: 'all' as const },
    { label: 'Pendientes', value: comments.filter(c => c.status === 'pending').length, filter: 'pending' as const },
    { label: 'Aprobados', value: comments.filter(c => c.status === 'approved').length, filter: 'approved' as const },
    { label: 'Rechazados', value: comments.filter(c => c.status === 'rejected').length, filter: 'rejected' as const },
  ];

  const statusColors = {
    pending: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
    approved: { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--color-success)' },
    rejected: { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--color-error)' },
  };

  const statusLabels = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  };

  const averageRating = getAverageRating();

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ color: 'var(--color-text)' }}>
          Gestión de Comentarios
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Modera y gestiona las reseñas de clientes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <button
            key={stat.filter}
            onClick={() => setFilter(stat.filter)}
            className="bg-white rounded-xl p-6 text-left transition-all hover:scale-105"
            style={{
              boxShadow: 'var(--shadow-md)',
              outline: filter === stat.filter ? '2px solid var(--color-primary)' : 'none',
              outlineOffset: '2px'
            }}
          >
            <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              {stat.label}
            </p>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
              {stat.value}
            </p>
          </button>
        ))}

        <div
          className="text-white rounded-xl p-6"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <p className="text-sm mb-1 opacity-90">Promedio</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold">{averageRating.toFixed(1)}</p>
            <Star className="w-6 h-6 fill-white" />
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedComment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ color: 'var(--color-text)' }}>
                Detalle del Comentario
              </h2>
              <button
                onClick={() => setSelectedComment(null)}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  Estado
                </h3>
                <span
                  className="inline-block text-xs px-3 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: statusColors[selectedComment.status].bg,
                    color: statusColors[selectedComment.status].text
                  }}
                >
                  {statusLabels[selectedComment.status]}
                </span>
              </div>

              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  Cliente
                </h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  {selectedComment.userName}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {selectedComment.userEmail}
                </p>
              </div>

              {selectedComment.serviceName && (
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    Servicio
                  </h3>
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedComment.serviceName}
                  </p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  Calificación
                </h3>
                {renderStars(selectedComment.rating)}
              </div>

              <div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  Comentario
                </h3>
                <p className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
                  {selectedComment.comment}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  Fecha
                </h4>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  {new Date(selectedComment.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                  Acciones
                </h3>
                <div className="flex gap-3">
                  {selectedComment.status !== 'approved' && (
                    <button
                      onClick={() => handleApprove(selectedComment.id)}
                      className="flex-1 text-white py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                      style={{ backgroundColor: 'var(--color-success)' }}
                    >
                      <ThumbsUp className="w-5 h-5" />
                      Aprobar
                    </button>
                  )}
                  {selectedComment.status !== 'rejected' && (
                    <button
                      onClick={() => handleReject(selectedComment.id)}
                      className="flex-1 text-white py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                      style={{ backgroundColor: 'var(--color-error)' }}
                    >
                      <ThumbsDown className="w-5 h-5" />
                      Rechazar
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedComment.id)}
                    className="px-6 text-white py-3 rounded-lg transition-all"
                    style={{ backgroundColor: '#6b7280' }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredComments.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-secondary)' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>
              No hay comentarios {filter !== 'all' && 'con este estado'}
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white rounded-xl p-6 transition-all hover:scale-105"
              style={{ boxShadow: 'var(--shadow-md)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                    {comment.userName}
                  </p>
                  {renderStars(comment.rating)}
                </div>
                <span
                  className="inline-block text-xs px-3 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: statusColors[comment.status].bg,
                    color: statusColors[comment.status].text
                  }}
                >
                  {statusLabels[comment.status]}
                </span>
              </div>

              {comment.serviceName && (
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Servicio: {comment.serviceName}
                </p>
              )}

              <p className="mb-4 line-clamp-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {comment.comment}
              </p>

              <div className="flex items-center justify-between text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                <span>{new Date(comment.createdAt).toLocaleDateString('es-ES')}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedComment(comment)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all"
                  style={{
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    color: 'var(--color-primary)'
                  }}
                >
                  <Eye className="w-4 h-4" />
                  <span>Ver</span>
                </button>
                {comment.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(comment.id)}
                      className="p-2 rounded-lg transition-all"
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--color-success)'
                      }}
                      title="Aprobar"
                    >
                      <ThumbsUp className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleReject(comment.id)}
                      className="p-2 rounded-lg transition-all"
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--color-error)'
                      }}
                      title="Rechazar"
                    >
                      <ThumbsDown className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="p-2 rounded-lg transition-all"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-secondary)'
                  }}
                  title="Eliminar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
