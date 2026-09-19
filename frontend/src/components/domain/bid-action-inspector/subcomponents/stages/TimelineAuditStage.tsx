import React from 'react';
import { Clock, Filter, Search } from 'lucide-react';
import type { TimelineEvent, TimelineCategoryFilter } from '../../types/bidActionInspector.types';

export interface TimelineAuditStageProps {
  allEvents: TimelineEvent[];
  filteredEvents: TimelineEvent[];
  timelineCategoryFilter: TimelineCategoryFilter;
  setTimelineCategoryFilter: (cat: TimelineCategoryFilter) => void;
  timelineSearchQuery: string;
  setTimelineSearchQuery: (query: string) => void;
}

export const TimelineAuditStage: React.FC<TimelineAuditStageProps> = ({
  allEvents,
  filteredEvents,
  timelineCategoryFilter,
  setTimelineCategoryFilter,
  timelineSearchQuery,
  setTimelineSearchQuery
}) => {
  return (
    <div
      data-testid="timeline-audit-surface"
      className="relative flex flex-col gap-6 w-full max-w-[1100px] mx-auto"
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Header & Controls bar */}
      <div
        data-testid="timeline-controls-bar"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 18px',
          backgroundColor: 'hsl(var(--bg-main))',
          borderRadius: '10px',
          border: '1px solid rgba(148, 163, 184, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} style={{ color: 'hsl(var(--primary))' }} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
            Lifecycle Audit Trail & Event Stream
          </h3>
          <span
            data-testid="timeline-event-count"
            style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}
          >
            ({filteredEvents.length} of {allEvents.length} events)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Category Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} style={{ color: 'hsl(var(--text-muted))' }} />
            <select
              aria-label="Filter Events Category"
              data-testid="timeline-category-filter"
              value={timelineCategoryFilter}
              onChange={(e) => setTimelineCategoryFilter(e.target.value as TimelineCategoryFilter)}
              style={{
                height: '42px',
                padding: '0 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                backgroundColor: 'hsl(var(--bg-card))',
                color: 'hsl(var(--text-primary))',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                outline: 'none',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
              }}
            >
              <option value="all">All Events</option>
              <option value="negotiations">Negotiations</option>
              <option value="system">System Notes</option>
              <option value="status">Status Transitions</option>
            </select>
          </div>

          {/* Real-time Search Input - Correlated search width */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', maxWidth: '320px', width: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }} />
            <input
              type="text"
              aria-label="Search timeline events"
              data-testid="timeline-search-input"
              placeholder="Search events or actors..."
              value={timelineSearchQuery}
              onChange={(e) => setTimelineSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 14px 0 38px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                backgroundColor: 'hsl(var(--bg-card))',
                color: 'hsl(var(--text-primary))',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                outline: 'none',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                minWidth: '220px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Chronological Activity Feed */}
      {filteredEvents.length === 0 ? (
        <div
          data-testid="timeline-empty-state"
          style={{
            padding: '36px',
            textAlign: 'center',
            backgroundColor: 'hsl(var(--bg-main) / 30%)',
            borderRadius: '10px',
            border: '1px dashed hsl(var(--border-color))',
            color: 'hsl(var(--text-muted))',
            fontSize: '0.9rem'
          }}
        >
          No events match the selected filter criteria.
        </div>
      ) : (
        <div
          data-testid="timeline-activity-feed"
          style={{
            position: 'relative',
            paddingLeft: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {/* Vertical timeline spine line */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              bottom: '12px',
              left: '11px',
              width: '2px',
              backgroundColor: 'hsl(var(--border-color))'
            }}
          />

          {filteredEvents.map((event) => {
            const isNegotiation = event.category === 'negotiations';
            const isStatus = event.category === 'status';

            // Amber for negotiations, emerald/red for status transitions, blue for system notes
            const isStatusDecline = isStatus && (event.id.includes('reject') || event.title.toLowerCase().includes('decline'));
            const isStatusCounter = isStatus && (event.id.includes('counter') || event.title.toLowerCase().includes('counter'));
            const statusColor = isStatusDecline ? '#ef4444' : isStatusCounter ? '#f59e0b' : '#10b981';

            const nodeColor = isNegotiation ? '#f59e0b' : isStatus ? statusColor : '#3b82f6';
            const categoryBg = isNegotiation
              ? 'rgba(245, 158, 11, 0.15)'
              : isStatus
                ? (isStatusDecline ? 'rgba(239, 68, 68, 0.15)' : isStatusCounter ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)')
                : 'rgba(59, 130, 246, 0.15)';
            const categoryText = isNegotiation
              ? '#f59e0b'
              : isStatus
                ? statusColor
                : '#3b82f6';

            return (
              <div
                key={event.id}
                data-testid={`timeline-event-card-${event.id}`}
                style={{
                  position: 'relative',
                  backgroundColor: 'hsl(var(--bg-card))',
                  border: '1px solid hsl(var(--border-color))',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                {/* Node dot on vertical spine */}
                <div
                  data-testid="timeline-node-dot"
                  style={{
                    position: 'absolute',
                    left: '-27px',
                    top: '20px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: nodeColor,
                    border: '2px solid hsl(var(--bg-card))',
                    boxShadow: `0 0 0 2px ${nodeColor}`
                  }}
                />

                {/* Top card metadata row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      data-testid="timeline-event-category-badge"
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: categoryBg,
                        color: categoryText
                      }}
                    >
                      {event.category}
                    </span>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                      {event.title}
                    </h4>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                    <span data-testid="timeline-event-actor" style={{ fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
                      {event.actor}
                    </span>
                    <span>•</span>
                    <span data-testid="timeline-event-time">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Description content */}
                {(() => {
                  const raw = event.description || '';
                  const hasEmailMarkup = /<\/?(p|span|div|a|strong|em|br)[^>]*>/i.test(raw);

                  if (!hasEmailMarkup) {
                    return (
                      <div
                        data-testid="timeline-event-description"
                        style={{
                          fontSize: '0.85rem',
                          color: 'hsl(var(--text-secondary))',
                          lineHeight: 1.5,
                          marginBottom: '8px'
                        }}
                      >
                        {raw}
                      </div>
                    );
                  }

                  // Strip HTML tags and normalize whitespace/newlines for email content
                  let cleaned = raw
                    // Convert block/paragraph closings and breaks to newlines
                    .replace(/<\/(p|div|h[1-6]|tr|li|blockquote)>/gi, '\n\n')
                    .replace(/<br\s*[\/]?>/gi, '\n')
                    // Remove remaining HTML tags
                    .replace(/<[^>]+>/g, '')
                    // Decode basic HTML entities
                    .replace(/&nbsp;/gi, ' ')
                    .replace(/&amp;/gi, '&')
                    .replace(/&lt;/gi, '<')
                    .replace(/&gt;/gi, '>')
                    .replace(/&quot;/gi, '"')
                    .replace(/&#39;/gi, "'")
                    // Normalize horizontal whitespace per line
                    .replace(/[ \t]+/g, ' ')
                    // Normalize multiple consecutive line breaks
                    .replace(/\n\s*\n\s*\n+/g, '\n\n')
                    .trim();

                  return (
                    <div
                      data-testid="timeline-event-description"
                      style={{
                        fontSize: '0.85rem',
                        color: 'hsl(var(--text-secondary))',
                        lineHeight: 1.55,
                        marginBottom: '8px',
                        whiteSpace: 'pre-line'
                      }}
                    >
                      {cleaned}
                    </div>
                  );
                })()}

                {/* Bottom reference ID */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                  <span
                    data-testid="timeline-event-ref-id"
                    style={{
                      fontFamily: 'monospace',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'hsl(var(--bg-main))',
                      border: '1px solid hsl(var(--border-color))'
                    }}
                  >
                    Ref: {event.referenceId}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
