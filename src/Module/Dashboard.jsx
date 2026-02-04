import React, { useState, useMemo, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- SVG Icons ---
const IconPlus = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconEdit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconAlert = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;

// --- Modal Component ---
function Modal({ isOpen, onClose, title, children, onSave, saveText = "Save", saveClass = "bg-rose-600 hover:bg-rose-500" }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-6 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
                <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
                {children}
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors">Cancel</button>
                    <button onClick={onSave} className={`px-6 py-2 text-white rounded-lg font-bold transition-all ${saveClass}`}>{saveText}</button>
                </div>
            </div>
        </div>
    );
}

// --- Task Card ---
function TaskCard({ task, deleteTask, editTask }) {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { type: "Task", task },
    });

    const priorityStyles = {
        High: "bg-rose-500/20 text-rose-500 border-rose-500/50",
        Medium: "bg-amber-500/20 text-amber-500 border-amber-500/50",
        Low: "bg-emerald-500/20 text-emerald-500 border-emerald-500/50",
    };

    const style = { transition, transform: CSS.Translate.toString(transform) };
    if (isDragging) return <div ref={setNodeRef} style={style} className="opacity-30 bg-slate-800 h-[120px] rounded-xl border-2 border-rose-500" />;

    return (
        <div
            ref={setNodeRef} style={style} {...attributes} {...listeners}
            className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:ring-2 hover:ring-rose-500 group relative cursor-grab active:cursor-grabbing shadow-lg"
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${priorityStyles[task.priority]}`}>
                    {task.priority}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); editTask(task); }} className="text-slate-400 hover:text-white"><IconEdit /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="text-rose-500 hover:text-rose-400"><IconTrash /></button>
                </div>
            </div>
            <h4 className="text-white font-bold text-sm mb-1">{task.title}</h4>
            <p className="text-slate-400 text-xs line-clamp-2">{task.description}</p>
        </div>
    );
}

// --- Column Component ---
function Column({ column, tasks, deleteTask, openTaskModal, openColModal }) {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: column.id,
        data: { type: "Column", column },
    });

    const style = { transition, transform: CSS.Translate.toString(transform) };
    const tasksIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

    if (isDragging) return <div ref={setNodeRef} style={style} className="bg-slate-800 opacity-40 w-[320px] h-[650px] rounded-2xl border-2 border-rose-500" />;

    return (
        <div ref={setNodeRef} style={style} className="bg-slate-800/40 w-[320px] h-[650px] rounded-2xl flex flex-col border border-slate-700/50 backdrop-blur-sm shadow-xl">
            <div {...attributes} {...listeners} className="p-4 flex items-center justify-between cursor-grab bg-slate-800/60 rounded-t-2xl border-b border-slate-700">
                <h3 className="text-white font-bold flex gap-2 items-center">
                    <span className="bg-slate-700 text-[10px] px-2 py-0.5 rounded-full font-mono">{tasks.length}</span>
                    {column.title}
                </h3>
                <button onClick={() => openColModal(column)} className="text-slate-400 hover:text-white transition-colors"><IconEdit /></button>
            </div>

            <div className="flex-grow p-3 flex flex-col gap-4 overflow-y-auto">
                <SortableContext items={tasksIds} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} deleteTask={deleteTask} editTask={openTaskModal} />
                    ))}
                </SortableContext>
            </div>

            <button onClick={() => openTaskModal(null, column.id)} className="m-3 p-3 text-slate-400 border-2 border-dashed border-slate-700 rounded-xl hover:border-rose-500 hover:text-rose-500 hover:bg-rose-500/5 transition-all flex justify-center items-center gap-2 font-medium">
                <IconPlus /> Add Task
            </button>
        </div>
    );
}

// --- Main Board ---
export default function KanbanBoard() {
    const [columns, setColumns] = useState(() => {
        const saved = localStorage.getItem("kanban-columns");
        return saved ? JSON.parse(saved) : [{ id: "1", title: "Todo" }, { id: "2", title: "Done" }];
    });

    const [tasks, setTasks] = useState(() => {
        const saved = localStorage.getItem("kanban-tasks");
        return saved ? JSON.parse(saved) : [];
    });

    const [activeColumn, setActiveColumn] = useState(null);
    const [activeTask, setActiveTask] = useState(null);

    // Modal & Form States
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const [isColModalOpen, setColModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

    const [taskToDelete, setTaskToDelete] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [editingCol, setEditingCol] = useState(null);
    const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "Medium" });
    const [colTitle, setColTitle] = useState("");
    const [targetColId, setTargetColId] = useState(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => {
        localStorage.setItem("kanban-columns", JSON.stringify(columns));
        localStorage.setItem("kanban-tasks", JSON.stringify(tasks));
    }, [columns, tasks]);

    // Handlers
    const requestDeleteTask = (id) => {
        setTaskToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDeleteTask = () => {
        setTasks(tasks.filter(t => t.id !== taskToDelete));
        setDeleteModalOpen(false);
        setTaskToDelete(null);
    };

    const handleOpenTaskModal = (task = null, colId = null) => {
        if (task) {
            setEditingTask(task);
            setTaskForm({ title: task.title, description: task.description, priority: task.priority });
        } else {
            setEditingTask(null);
            setTargetColId(colId);
            setTaskForm({ title: "", description: "", priority: "Medium" });
        }
        setTaskModalOpen(true);
    };

    const handleOpenColModal = (col = null) => {
        if (col) {
            setEditingCol(col);
            setColTitle(col.title);
        } else {
            setEditingCol(null);
            setColTitle("");
        }
        setColModalOpen(true);
    };

    // Drag Handlers
    const onDragStart = (e) => {
        if (e.active.data.current?.type === "Column") setActiveColumn(e.active.data.current.column);
        if (e.active.data.current?.type === "Task") setActiveTask(e.active.data.current.task);
    };

    const onDragOver = (e) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const isActiveTask = active.data.current?.type === "Task";
        const isOverColumn = over.data.current?.type === "Column";
        if (isActiveTask && isOverColumn) {
            setTasks(t => {
                const idx = t.findIndex(x => x.id === active.id);
                t[idx].columnId = over.id;
                return arrayMove(t, idx, idx);
            });
        }
    };

    const onDragEnd = (e) => {
        setActiveColumn(null);
        setActiveTask(null);
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const setter = active.data.current?.type === "Column" ? setColumns : setTasks;
        setter(items => {
            const oldIdx = items.findIndex(i => i.id === active.id);
            const newIdx = items.findIndex(i => i.id === over.id);
            return arrayMove(items, oldIdx, newIdx);
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 p-10 flex gap-6 items-start overflow-x-auto selection:bg-rose-500/30">
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
                <div className="flex gap-6">
                    <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                        {columns.map(col => (
                            <Column
                                key={col.id}
                                column={col}
                                tasks={tasks.filter(t => t.columnId === col.id)}
                                deleteTask={requestDeleteTask}
                                openTaskModal={handleOpenTaskModal}
                                openColModal={handleOpenColModal}
                            />
                        ))}
                    </SortableContext>
                </div>

                <button onClick={() => handleOpenColModal()} className="h-[60px] min-w-[320px] bg-slate-900 border-2 border-slate-800 rounded-2xl text-white font-bold flex items-center justify-center gap-2 hover:border-rose-500 transition-colors group">
                    <div className="p-1 bg-slate-800 group-hover:bg-rose-600 rounded transition-colors"><IconPlus /></div>
                    Add Column
                </button>

                <DragOverlay>
                    {activeColumn && <Column column={activeColumn} tasks={tasks.filter(t => t.columnId === activeColumn.id)} />}
                    {activeTask && <TaskCard task={activeTask} />}
                </DragOverlay>
            </DndContext>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Task?"
                saveText="Delete Task"
                saveClass="bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-900/40"
                onSave={confirmDeleteTask}
            >
                <div className="flex flex-col items-center text-center gap-4">
                    <IconAlert />
                    <p className="text-slate-300">This action cannot be undone. Are you sure you want to remove this task from your board?</p>
                </div>
            </Modal>

            {/* Task Creation/Edit Modal */}
            <Modal isOpen={isTaskModalOpen} onClose={() => setTaskModalOpen(false)} title={editingTask ? "Edit Task" : "New Task"} onSave={() => {
                if (!taskForm.title) return;
                if (editingTask) {
                    setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...taskForm } : t));
                } else {
                    setTasks([...tasks, { id: Date.now().toString(), columnId: targetColId, ...taskForm }]);
                }
                setTaskModalOpen(false);
            }}>
                <div className="space-y-4">
                    <input className="w-full bg-slate-800 p-3 rounded-xl text-white border border-slate-700 outline-none focus:border-rose-500" placeholder="Task Title" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
                    <textarea className="w-full bg-slate-800 p-3 rounded-xl text-white border border-slate-700 outline-none focus:border-rose-500 h-24 resize-none" placeholder="Description" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
                    <div className="flex gap-2">
                        {['Low', 'Medium', 'High'].map(p => (
                            <button key={p} onClick={() => setTaskForm({ ...taskForm, priority: p })} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${taskForm.priority === p ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-900/40' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* Column Modal */}
            <Modal isOpen={isColModalOpen} onClose={() => setColModalOpen(false)} title={editingCol ? "Rename Column" : "Add Column"} onSave={() => {
                if (!colTitle) return;
                if (editingCol) {
                    setColumns(columns.map(c => c.id === editingCol.id ? { ...c, title: colTitle } : c));
                } else {
                    setColumns([...columns, { id: Date.now().toString(), title: colTitle }]);
                }
                setColModalOpen(false);
            }}>
                <input className="w-full bg-slate-800 p-3 rounded-xl text-white border border-slate-700 outline-none focus:border-rose-500" placeholder="Column Name" value={colTitle} onChange={e => setColTitle(e.target.value)} />
            </Modal>
        </div>
    );
}