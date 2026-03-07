import React, { useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { useLiveboardStore } from '../../store/liveboardStore';
import { useUiStore } from '../../store/uiStore';
import { ChartCard } from '../chart/ChartCard';
import { EmptyState } from '../shared/EmptyState';
import { Button } from '../shared/Button';
import { BarChart3, Search } from 'lucide-react';

const ROW_HEIGHT = 80;
const COLS = { lg: 12, md: 10, sm: 6, xs: 4 };

const ResponsiveGrid = WidthProvider(Responsive);

export function LiveboardCanvas() {
  const { activeLiveboard, updateLayout, saveLayout } = useLiveboardStore();
  const { openNlq } = useUiStore();

  const handleLayoutChange = useCallback(
    (_layout: Layout[], allLayouts: Record<string, Layout[]>) => {
      const lgLayout = allLayouts.lg || _layout;
      updateLayout(lgLayout.map((l) => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h })));
    },
    [updateLayout]
  );

  if (!activeLiveboard) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <EmptyState
          icon={<BarChart3 size={48} />}
          title="No liveboard selected"
          description="Create a liveboard or select one from the sidebar, then start asking questions to populate it with charts."
          action={
            <Button variant="primary" icon={<Search size={14} />} onClick={openNlq}>
              Ask a question
            </Button>
          }
        />
      </div>
    );
  }

  if (activeLiveboard.charts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <EmptyState
          icon={<BarChart3 size={48} />}
          title={`"${activeLiveboard.name}" is empty`}
          description="Ask a question and pin the resulting chart to this liveboard."
          action={
            <Button variant="primary" icon={<Search size={14} />} onClick={openNlq}>
              Ask a question
            </Button>
          }
        />
      </div>
    );
  }

  const layouts = {
    lg: activeLiveboard.charts.map((c) => ({
      i: c.id,
      x: c.layout.x,
      y: c.layout.y,
      w: c.layout.w,
      h: c.layout.h,
      minW: c.layout.minW ?? 3,
      minH: c.layout.minH ?? 3,
    })),
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-4">
      <ResponsiveGrid
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        draggableHandle=".chart-card-header"
        margin={[12, 12]}
        onLayoutChange={handleLayoutChange}
        onDragStop={() => saveLayout()}
        onResizeStop={() => saveLayout()}
      >
        {activeLiveboard.charts.map((chart) => {
          const layout = layouts.lg.find((l) => l.i === chart.id);
          const pixelHeight = (layout?.h ?? 4) * (ROW_HEIGHT + 12);
          return (
            <div key={chart.id}>
              <ChartCard chart={chart} height={pixelHeight} />
            </div>
          );
        })}
      </ResponsiveGrid>
    </div>
  );
}
