import React, { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { useUiStore } from '../../store/uiStore';
import { useLiveboardStore } from '../../store/liveboardStore';
import { useNavigate } from 'react-router-dom';

export function NewLiveboardModal() {
  const { newLiveboardModalOpen, closeNewLiveboardModal } = useUiStore();
  const { createLiveboard, setActiveLiveboard } = useLiveboardStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const lb = await createLiveboard(name.trim(), description.trim() || undefined);
      setActiveLiveboard(lb);
      navigate(`/liveboard/${lb.id}`);
      closeNewLiveboardModal();
      setName('');
      setDescription('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={newLiveboardModalOpen} onClose={closeNewLiveboardModal} title="New Liveboard">
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q4 Sales Overview"
            className="w-full rounded-lg border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none px-3 py-2 text-sm transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of this liveboard..."
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none px-3 py-2 text-sm transition-all"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={closeNewLiveboardModal}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading} disabled={!name.trim()}>
            Create liveboard
          </Button>
        </div>
      </form>
    </Modal>
  );
}
