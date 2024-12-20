import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';
import { cn } from '../../lib/utils';
import type { Task } from '../../types/supabase';

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDelete?: (id: string) => void;
}

export function TaskColumn({ id, title, tasks, onEditTask, onDelete }: TaskColumnProps) {
  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-muted/50">
      <div className="p-4 border-b border-border">
        <h3 className="font-medium text-sm flex items-center justify-between">
          {title}
          <span className="text-xs text-muted-foreground">
            {tasks.length}
          </span>
        </h3>
      </div>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 p-4 overflow-y-auto",
              snapshot.isDraggingOver && "bg-accent"
            )}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onEdit={onEditTask}
                onDelete={onDelete}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}