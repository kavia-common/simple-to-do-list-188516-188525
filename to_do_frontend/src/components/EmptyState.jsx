import React from "react";

// PUBLIC_INTERFACE
export default function EmptyState() {
  /** Empty state shown when there are no tasks. */
  return (
    <div className="empty-state surface card" role="status" aria-live="polite">
      <div className="empty-art" aria-hidden="true">📝</div>
      <h2 className="subtitle">No tasks yet</h2>
      <p className="muted">Add your first task to get started.</p>
    </div>
  );
}
