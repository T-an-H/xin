import { useState, useRef } from 'react';
import {
  Cloud,
  Upload,
  Download,
  Trash2,
  FileText,
  CheckCircle,
  Circle,
  Plus,
  Edit3,
  Save,
  X,
  File,
  Image,
  FileSpreadsheet,
  FileArchive,
  LucideIcon,
} from 'lucide-react';
import { useStore } from '@/store';
import type { CloudFile, TodoItem, OnlineDoc, Note } from '@/types';

type Tab = 'cloud' | 'todos' | 'docs' | 'notes';

const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'cloud', label: '云盘', icon: Cloud },
  { id: 'todos', label: '待办', icon: CheckCircle },
  { id: 'docs', label: '在线文档', icon: FileText },
  { id: 'notes', label: '笔记', icon: Edit3 },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function getFileIcon(type: string): LucideIcon {
  if (type.startsWith('image/')) return Image;
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet;
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return FileArchive;
  return File;
}

/* ─────────── 云盘 ─────────── */
function CloudDrive() {
  const { cloudFiles, addCloudFile, deleteCloudFile } = useStore();
  const currentUser = useStore((s) => s.currentUser);
  const myCloudFiles = cloudFiles.filter((f) => f.uploadedBy === currentUser);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      addCloudFile({
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser || '未知',
      });
    };
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDownload = (f: CloudFile) => {
    const a = document.createElement('a');
    a.href = f.dataUrl;
    a.download = f.name;
    a.click();
  };

  const Icon = getFileIcon;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Upload className="w-4 h-4" />
          上传文件
        </button>
        <span className="text-sm text-gray-400">已用 {myCloudFiles.length} 个文件</span>
      </div>

      {myCloudFiles.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Cloud className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无文件，点击上方按钮上传</p>
        </div>
      )}

      <div className="space-y-2">
        {myCloudFiles.map((f) => {
          const Icn = Icon(f.type);
          return (
            <div key={f.id} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                <Icn className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                <p className="text-xs text-gray-400">
                  {formatSize(f.size)} · {f.uploadedBy} · {formatDate(f.uploadedAt)}
                </p>
              </div>
              <button
                onClick={() => handleDownload(f)}
                className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                title="下载"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteCloudFile(f.id)}
                className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────── 待办 ─────────── */
function TodoList() {
  const { todos, addTodo, updateTodo, deleteTodo } = useStore();
  const currentUser = useStore((s) => s.currentUser);
  const myTodos = todos.filter((t) => t.createdBy === currentUser);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;
    addTodo({
      id: Date.now().toString(),
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: dueDate || undefined,
      createdBy: currentUser || '未知',
    });
    setTitle('');
    setDueDate('');
  };

  const activeTodos = myTodos.filter((t) => !t.completed);
  const doneTodos = myTodos.filter((t) => t.completed);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="添加待办事项..."
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 outline-none text-sm"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          添加
        </button>
      </div>

      {activeTodos.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">待完成</p>
          {activeTodos.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm group">
              <button onClick={() => updateTodo(t.id, { completed: true })} className="flex-shrink-0">
                <Circle className="w-5 h-5 text-gray-300 hover:text-emerald-500 transition-colors" />
              </button>
              <span className="flex-1 text-sm text-gray-900">{t.title}</span>
              {t.dueDate && <span className="text-xs text-gray-400">{t.dueDate}</span>}
              <button onClick={() => deleteTodo(t.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-400 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {doneTodos.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">已完成</p>
          {doneTodos.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-50">
              <button onClick={() => updateTodo(t.id, { completed: false })} className="flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </button>
              <span className="flex-1 text-sm text-gray-400 line-through">{t.title}</span>
              <button onClick={() => deleteTodo(t.id)} className="p-1 rounded hover:bg-red-50 text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {myTodos.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无待办事项</p>
        </div>
      )}
    </div>
  );
}

/* ─────────── 在线文档 ─────────── */
function OnlineDocs() {
  const { onlineDocs, addOnlineDoc, updateOnlineDoc, deleteOnlineDoc } = useStore();
  const currentUser = useStore((s) => s.currentUser);
  const myDocs = onlineDocs.filter((d) => d.createdBy === currentUser);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    addOnlineDoc({
      id: Date.now().toString(),
      title: newTitle.trim(),
      content: '',
      createdBy: currentUser || '未知',
      createdAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
      lastEditedBy: currentUser || '未知',
    });
    setNewTitle('');
  };

  const handleSave = (id: string) => {
    updateOnlineDoc(id, {
      title: editTitle,
      content: editContent,
      lastEditedAt: new Date().toISOString(),
      lastEditedBy: currentUser || '未知',
    });
    setEditingId(null);
  };

  const startEdit = (doc: OnlineDoc) => {
    setEditingId(doc.id);
    setEditTitle(doc.title);
    setEditContent(doc.content);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="新建文档标题..."
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm"
        />
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          新建
        </button>
      </div>

      {myDocs.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无文档，点击上方按钮新建</p>
        </div>
      )}

      {myDocs.map((doc) => (
        <div key={doc.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {editingId === doc.id ? (
            <div className="p-4 space-y-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 outline-none text-sm font-medium"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 outline-none text-sm resize-y"
                placeholder="在此输入文档内容..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSave(doc.id)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm"
                >
                  <Save className="w-4 h-4" />
                  保存
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900">{doc.title}</h4>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(doc)}
                    className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-500 transition-colors"
                    title="编辑"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteOnlineDoc(doc.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {doc.content && (
                <p className="text-sm text-gray-600 whitespace-pre-wrap mb-3 line-clamp-3">{doc.content}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{doc.createdBy}</span>
                <span>创建于 {formatDate(doc.createdAt)}</span>
                <span>最后编辑 {formatDate(doc.lastEditedAt)}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────── 笔记 ─────────── */
function Notes() {
  const { notes, addNote, updateNote, deleteNote } = useStore();
  const currentUser = useStore((s) => s.currentUser);
  const myNotes = notes.filter((n) => n.createdBy === currentUser);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    addNote({
      id: Date.now().toString(),
      title: newTitle.trim(),
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser || '未知',
    });
    setNewTitle('');
  };

  const handleSave = (id: string) => {
    updateNote(id, {
      title: editTitle,
      content: editContent,
      updatedAt: new Date().toISOString(),
    });
    setEditingId(null);
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="新建笔记标题..."
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm"
        />
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          新建
        </button>
      </div>

      {myNotes.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Edit3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无笔记，点击上方按钮新建</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {myNotes.map((note) => (
          <div key={note.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {editingId === note.id ? (
              <div className="p-4 space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm font-medium"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm resize-y"
                  placeholder="在此输入笔记内容..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(note.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors h-full"
                onClick={() => startEdit(note)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{note.title}</h4>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                    className="p-1 rounded hover:bg-red-50 text-red-400 transition-colors flex-shrink-0"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {note.content && (
                  <p className="text-sm text-gray-500 whitespace-pre-wrap line-clamp-3 mb-2">{note.content}</p>
                )}
                <p className="text-xs text-gray-400">更新于 {formatDate(note.updatedAt)}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── 主组件 ─────────── */
export default function ExtraFeatures() {
  const [activeTab, setActiveTab] = useState<Tab>('cloud');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">额外功能</h1>
        <p className="text-gray-500 mt-1">云盘 · 待办 · 在线文档 · 笔记</p>
      </div>

      {/* Tab 导航 */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 内容区 */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        {activeTab === 'cloud' && <CloudDrive />}
        {activeTab === 'todos' && <TodoList />}
        {activeTab === 'docs' && <OnlineDocs />}
        {activeTab === 'notes' && <Notes />}
      </div>
    </div>
  );
}
