import type { ReactNode } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, sortableKeyboardCoordinates, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LabSortArea({ ids, onMove, capsules = false, children }: { ids: string[]; onMove: (from: string, to: string) => void; capsules?: boolean; children: ReactNode }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({active,over})=>{if(over && active.id!==over.id)onMove(String(active.id),String(over.id));}}><SortableContext items={ids} strategy={capsules?rectSortingStrategy:verticalListSortingStrategy}>{children}</SortableContext></DndContext>;
}
export function LabSortable({ id, label, capsule = false, children }: { id: string; label: string; capsule?: boolean; children?: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  if(capsule) return <Button ref={setNodeRef} style={style} variant="outline" size="sm" className={`h-auto min-h-8 max-w-full touch-none whitespace-normal rounded-full text-left ${isDragging?'relative z-10 bg-accent opacity-70':'bg-background'}`} aria-label={`Reordonează ${label}`} {...attributes} {...listeners}><GripVertical />{label}</Button>;
  return <div ref={setNodeRef} style={style} className={`relative min-w-0 py-3 ${isDragging?'z-10 bg-accent opacity-70':''}`}><div className="flex items-start gap-2"><Button variant="ghost" size="icon" className="h-8 w-6 shrink-0 touch-none cursor-grab active:cursor-grabbing" aria-label={`Reordonează ${label}`} title={`Reordonează ${label}`} {...attributes} {...listeners}><GripVertical /></Button><div className="min-w-0 flex-1">{children}</div></div></div>;
}