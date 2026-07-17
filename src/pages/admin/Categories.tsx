import { useState } from 'react';
import { useStore } from '@/store';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Modal from '@/components/Modal';
import type { Category } from '@/types';

const presetColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#14b8a6', '#f97316'];

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const openCreate = () => {
    setEditing({ id: `cat-${Date.now()}`, name: '', color: presetColors[0], courseCount: 0 });
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing({ ...cat });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!editing) return;
    const exists = categories.find((c) => c.id === editing.id);
    if (exists) {
      updateCategory(editing.id, editing);
    } else {
      addCategory(editing);
    }
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除此分类吗？')) {
      deleteCategory(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">分类管理</h1>
          <p className="text-gray-500 mt-1">管理课程分类</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-lg shadow-amber-500/25">
          <Plus className="w-5 h-5" />
          <span>新建分类</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{cat.name}</h3>
                <p className="text-xs text-gray-500">{cat.courseCount} 门课程</p>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-gray-50">
              <button onClick={() => openEdit(cat)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                <Edit2 className="w-4 h-4" /> 编辑
              </button>
              <button onClick={() => handleDelete(cat.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" /> 删除
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing?.id && categories.find((c) => c.id === editing.id) ? '编辑分类' : '新建分类'}>
        {editing && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类名称</label>
              <input type="text" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">颜色</label>
              <div className="flex flex-wrap gap-2">
                {presetColors.map((color) => (
                  <button key={color} onClick={() => setEditing({ ...editing, color })}
                    className={`w-8 h-8 rounded-lg transition-transform ${editing.color === color ? 'ring-2 ring-offset-2 ring-amber-500 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => { setModalOpen(false); setEditing(null); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
              <button onClick={handleSave}
                className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors">保存</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}