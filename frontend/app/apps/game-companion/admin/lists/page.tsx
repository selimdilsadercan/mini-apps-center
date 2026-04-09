'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, PencilSimple, Trash, ListBullets, DotsSix } from '@phosphor-icons/react';
import Sidebar from '../../components/Sidebar';
import { MOCK_GAME_LISTS } from '../../lib/mock-data';

// Type shim for UI-only mode
type Id<T> = string;

// Local mock hooks
const useAuth = () => ({
  isSignedIn: true,
  isLoaded: true,
});

const useQuery = (apiPath: any, args?: any): any => {
  if (apiPath.toString().includes("getAllGameLists")) return MOCK_GAME_LISTS.map(l => ({ ...l, gameIds: [] }));
  return [];
};

const useMutation = (apiPath: any) => async (args: any) => {
  console.log("Mock mutation:", apiPath, args);
  return true;
};
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function ListsPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListEmoji, setNewListEmoji] = useState('');

  // Drag and drop sensors with mobile support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch game lists from Convex
  const gameLists = useQuery("api.gameLists.getAllGameLists") || [];
  const createGameList = useMutation("api.gameLists.createGameList");
  const deleteGameList = useMutation("api.gameLists.deleteGameList");
  const updateGameListOrder = useMutation("api.gameLists.updateGameListOrder");

  // Redirect to home page if user is not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while checking authentication
  if (!isLoaded || (isLoaded && !isSignedIn)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    router.push('/apps/game-companion/admin');
  };

  const handleAddList = async () => {
    if (!newListName.trim()) return;

    try {
      await createGameList({
        name: newListName.trim(),
        emoji: newListEmoji.trim() || undefined,
        gameIds: [],
      });
      
      setNewListName('');
      setNewListEmoji('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating game list:', error);
    }
  };

  const handleEditList = (listId: string) => {
    router.push(`/apps/game-companion/admin/edit-list?listId=${listId}`);
  };

  const handleDeleteList = async (listId: string) => {
    if (confirm('Bu listeyi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteGameList({ id: listId });
      } catch (error) {
        console.error('Error deleting game list:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newListName.trim()) {
      handleAddList();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = (gameLists as any[]).findIndex((list: any) => list._id === active.id);
      const newIndex = (gameLists as any[]).findIndex((list: any) => list._id === over?.id);

      const newLists = arrayMove(gameLists, oldIndex, newIndex);

      // Update order indices
      const updates = newLists.map((list: any, index: number) => ({
        id: list._id,
        order: index + 1
      }));

      try {
        await updateGameListOrder({ updates });
      } catch (error) {
        console.error('Error updating list order:', error);
      }
    }
  };

  // Sortable item component
  function SortableItem({ list, onEdit, onDelete }: { 
    list: any; 
    onEdit: (id: Id<'gameLists'>) => void; 
    onDelete: (id: Id<'gameLists'>) => void; 
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: list._id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`px-6 py-4 hover:bg-gray-50 transition-colors select-none ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-1">
            <div className="flex items-center justify-center">
              <div 
                className="p-2 rounded hover:bg-gray-100 cursor-move touch-manipulation select-none"
                style={{ touchAction: 'none' }}
                {...attributes}
                {...listeners}
              >
                <DotsSix size={20} className="text-gray-800" />
              </div>
            </div>
          </div>
          <div className="col-span-6">
            <div className="flex items-center gap-2">
              {list.emoji && <span className="text-lg">{list.emoji}</span>}
              <h3 className="text-sm font-medium text-gray-900">
                {list.name}
              </h3>
            </div>
          </div>
          <div className="col-span-2">
            <span className="text-sm text-gray-600">
              {list.gameIds.length} oyun
            </span>
          </div>
          <div className="col-span-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              list.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {list.isActive ? 'Aktif' : 'Pasif'}
            </span>
          </div>
          <div className="col-span-1">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(list._id)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
              >
                <PencilSimple size={16} weight="regular" />
              </button>
              <button
                onClick={() => onDelete(list._id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash size={16} weight="regular" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0" style={{ backgroundColor: 'var(--background)' }}>
      {/* Sidebar for wide screens */}
      <Sidebar currentPage="admin" />
      
      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 lg:left-64 bg-white shadow-sm z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} weight="regular" className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Oyun Listeleri</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            <Plus size={20} weight="regular" />
            <span>Yeni Liste</span>
          </button>
        </div>
      </div>

      {/* Lists Table - Add top padding to account for fixed header */}
      <div className="px-6 py-6 pt-24">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Mevcut Listeler ({gameLists.length})</h2>
        </div>
        
        {gameLists.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg">
            <ListBullets size={48} weight="regular" className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Henüz liste eklenmemiş</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1 text-sm font-medium text-gray-700">
                  
                </div>
                <div className="col-span-6 text-sm font-medium text-gray-700">
                  Liste Adı
                </div>
                <div className="col-span-2 text-sm font-medium text-gray-700">
                  Oyun Sayısı
                </div>
                <div className="col-span-2 text-sm font-medium text-gray-700">
                  Durum
                </div>
                <div className="col-span-1 text-sm font-medium text-gray-700">
                  İşlemler
                </div>
              </div>
            </div>
            
            {/* Table Body */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={(gameLists as any[]).map((list: any) => list._id)} strategy={verticalListSortingStrategy}>
                <div className="divide-y divide-gray-200">
                  {(gameLists as any[]).map((list: any) => (
                    <SortableItem
                      key={list._id}
                      list={list}
                      onEdit={handleEditList}
                      onDelete={handleDeleteList}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      {/* Add List Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-[#00000080] flex items-center justify-center p-4 z-50"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Yeni Liste Ekle</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Liste Adı *
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Liste adını girin"
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emoji
                </label>
                <input
                  type="text"
                  value={newListEmoji}
                  onChange={(e) => setNewListEmoji(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="🔥 (isteğe bağlı)"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddList}
                disabled={!newListName.trim()}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300"
              >
                Ekle
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
