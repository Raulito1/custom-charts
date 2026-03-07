import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LiveboardCanvas } from '../components/liveboard/LiveboardCanvas';
import { useLiveboardStore } from '../store/liveboardStore';
import { Spinner } from '../components/shared/Spinner';

export function LiveboardPage() {
  const { id } = useParams<{ id: string }>();
  const { activeLiveboard, loadLiveboard, isLoading, error } = useLiveboardStore();

  useEffect(() => {
    if (id && activeLiveboard?.id !== id) {
      loadLiveboard(id);
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500 text-sm">{error}</div>
    );
  }

  return <LiveboardCanvas />;
}
