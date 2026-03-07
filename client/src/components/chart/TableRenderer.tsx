import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

interface TableRendererProps {
  data: Record<string, unknown>[];
  height?: number;
}

function inferHeader(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function inferCellStyle(value: unknown): React.CSSProperties {
  if (typeof value === 'number') return { textAlign: 'right' };
  return {};
}

export function TableRenderer({ data, height = 260 }: TableRendererProps) {
  const columnDefs = useMemo<ColDef[]>(() => {
    if (!data.length) return [];
    return Object.keys(data[0]).map((key) => {
      const sample = data[0][key];
      const isNum = typeof sample === 'number';
      return {
        field: key,
        headerName: inferHeader(key),
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
        minWidth: 100,
        type: isNum ? 'numericColumn' : undefined,
        cellStyle: inferCellStyle(sample),
        valueFormatter: isNum
          ? (p) => {
              const v = Number(p.value);
              if (Number.isInteger(v)) return v.toLocaleString();
              return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
            }
          : undefined,
      };
    });
  }, [data]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
        No data
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <AgGridReact
        rowData={data}
        columnDefs={columnDefs}
        defaultColDef={{ sortable: true, filter: true, resizable: true }}
        pagination={data.length > 50}
        paginationPageSize={50}
        suppressMovableColumns
        theme="legacy"
        className="ag-theme-alpine"
      />
    </div>
  );
}
