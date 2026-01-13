'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TableRow {
  label: string;
  values: (number | string)[];
  isHeader?: boolean;
  isTotal?: boolean;
  indent?: number;
  collapsible?: boolean;
  children?: TableRow[];
  className?: string;
}

interface FinancialTableProps {
  headers: string[];
  rows: TableRow[];
  className?: string;
}

export function FinancialTable({ headers, rows, className = '' }: FinancialTableProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (label: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(label)) {
      newCollapsed.delete(label);
    } else {
      newCollapsed.add(label);
    }
    setCollapsedSections(newCollapsed);
  };

  const formatValue = (value: number | string) => {
    if (typeof value === 'number') {
      if (value < 0) return `△${Math.abs(value).toLocaleString()}`;
      return value.toLocaleString();
    }
    return value;
  };

  const renderRow = (row: TableRow, index: number, parentCollapsed = false) => {
    if (parentCollapsed) return null;

    const isCollapsed = collapsedSections.has(row.label);

    return (
      <tr
        key={`${row.label}-${index}`}
        className={`
          ${row.isHeader
            ? 'bg-gradient-to-r from-blue-50 to-blue-100 cursor-pointer hover:from-blue-100 hover:to-blue-200 font-semibold text-blue-800'
            : ''
          }
          ${row.isTotal
            ? 'bg-gradient-to-r from-amber-50 to-amber-100 font-bold'
            : ''
          }
          ${!row.isHeader && !row.isTotal ? 'hover:bg-gray-50' : ''}
          ${row.className || ''}
          transition-colors
        `}
        onClick={() => row.collapsible && toggleSection(row.label)}
      >
        <td
          className="border border-slate-200 px-3 py-2 text-left"
          style={{ paddingLeft: `${(row.indent || 0) * 20 + 12}px` }}
        >
          <span className="flex items-center gap-2">
            {row.collapsible && (
              isCollapsed
                ? <ChevronRight className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4" />
            )}
            {row.label}
          </span>
        </td>
        {row.values.map((value, vIndex) => (
          <td
            key={vIndex}
            className={`border border-slate-200 px-3 py-2 text-right ${
              typeof value === 'string' && value.startsWith('+')
                ? 'text-emerald-600 font-medium'
                : typeof value === 'string' && value.startsWith('-')
                  ? 'text-red-500 font-medium'
                  : ''
            }`}
          >
            {formatValue(value)}
          </td>
        ))}
      </tr>
    );
  };

  const renderRows = (rowList: TableRow[], parentCollapsed = false): React.ReactNode[] => {
    const result: React.ReactNode[] = [];

    rowList.forEach((row, index) => {
      result.push(renderRow(row, index, parentCollapsed));

      if (row.children && row.children.length > 0) {
        const isCollapsed = collapsedSections.has(row.label);
        result.push(...renderRows(row.children.map(child => ({
          ...child,
          indent: (row.indent || 0) + 1,
        })), isCollapsed));
      }
    });

    return result;
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="bg-gradient-to-r from-[#2a5298] to-[#1e3c72] text-white px-3 py-3 text-center font-semibold border border-slate-300"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {renderRows(rows)}
        </tbody>
      </table>
    </div>
  );
}
