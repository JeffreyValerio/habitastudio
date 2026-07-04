"use client";

import { useEffect, useState } from "react";
import { getQuotesRevenueTrend } from "@/app/actions/quotes";
import { formatCRC } from "@/lib/utils";

interface ChartData {
  month: string;
  monthKey: string;
  quoted: number;
  accepted: number;
}

export function QuotesRevenueChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; type: "quoted" | "accepted" } | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const loadData = async () => {
      const trend = await getQuotesRevenueTrend(12);
      setData(trend);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Cargando gráfica...</div>;
  }

  if (data.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Sin datos</div>;
  }

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.quoted, d.accepted))
  );

  if (maxValue === 0) {
    return <div className="text-center py-8 text-muted-foreground">Sin datos para mostrar</div>;
  }

  const chartHeight = 320;
  const padding = { top: 30, right: 40, bottom: 60, left: 80 };

  // Calcular dimensiones dinámicamente
  const getChartDimensions = () => {
    const container = document.getElementById("chart-container");
    const width = container ? container.offsetWidth : 1000;
    return {
      width,
      graphWidth: width - padding.left - padding.right,
      graphHeight: chartHeight - padding.top - padding.bottom,
    };
  };

  const dims = getChartDimensions();
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const getY = (value: number) => {
    return padding.top + graphHeight - (value / maxValue) * graphHeight;
  };

  const getX = (index: number) => {
    return padding.left + (index / Math.max(data.length - 1, 1)) * dims.graphWidth;
  };

  const quotedPoints = data.map((d, i) => `${getX(i)},${getY(d.quoted)}`).join(" ");
  const acceptedPoints = data.map((d, i) => `${getX(i)},${getY(d.accepted)}`).join(" ");

  const handlePointHover = (index: number, type: "quoted" | "accepted", e: React.MouseEvent<SVGCircleElement>) => {
    const svg = e.currentTarget.closest("svg");
    if (!svg) return;

    const svgRect = svg.getBoundingClientRect();
    const circleRect = e.currentTarget.getBoundingClientRect();

    // Posición relativa al SVG
    const relativeX = circleRect.left - svgRect.left;
    const relativeY = circleRect.top - svgRect.top;

    setHoveredPoint({ index, type });
    setTooltipPos({
      x: relativeX,
      y: relativeY,
    });
  };

  const handlePointLeave = () => {
    setHoveredPoint(null);
  };

  const tooltipValue = hoveredPoint
    ? hoveredPoint.type === "quoted"
      ? data[hoveredPoint.index].quoted
      : data[hoveredPoint.index].accepted
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Evolución de Montos (12 meses)</h3>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span className="text-muted-foreground">Cotizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span className="text-muted-foreground">Aceptado</span>
          </div>
        </div>
      </div>

      <div id="chart-container" className="relative border rounded-lg bg-muted/30 overflow-hidden">
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${dims.width} ${chartHeight}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ minHeight: `${chartHeight}px` }}
        >
          {/* Grid horizontal lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + graphHeight - graphHeight * ratio;
            const value = maxValue * ratio;
            return (
              <g key={`grid-h-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={dims.width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  strokeDasharray="4,4"
                  strokeWidth="1"
                />
                {i > 0 && (
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    fontSize="12"
                    fill="currentColor"
                    opacity="0.5"
                    textAnchor="end"
                  >
                    {formatCRC(value)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={padding.top + graphHeight}
            x2={dims.width - padding.right}
            y2={padding.top + graphHeight}
            stroke="currentColor"
            strokeOpacity="0.3"
            strokeWidth="2"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + graphHeight}
            stroke="currentColor"
            strokeOpacity="0.3"
            strokeWidth="2"
          />

          {/* Quoted line (blue) */}
          <polyline
            points={quotedPoints}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Accepted line (green) */}
          <polyline
            points={acceptedPoints}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data points - Quoted */}
          {data.map((d, i) => (
            <circle
              key={`quoted-${i}`}
              cx={getX(i)}
              cy={getY(d.quoted)}
              r="5"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
              opacity="0.9"
              className="cursor-pointer hover:r-6 transition-all"
              onMouseEnter={(e) => handlePointHover(i, "quoted", e)}
              onMouseLeave={handlePointLeave}
            />
          ))}

          {/* Data points - Accepted */}
          {data.map((d, i) => (
            <circle
              key={`accepted-${i}`}
              cx={getX(i)}
              cy={getY(d.accepted)}
              r="5"
              fill="#10b981"
              stroke="white"
              strokeWidth="2"
              opacity="0.9"
              className="cursor-pointer hover:r-6 transition-all"
              onMouseEnter={(e) => handlePointHover(i, "accepted", e)}
              onMouseLeave={handlePointLeave}
            />
          ))}

          {/* Month labels */}
          {data.map((d, i) => (
            <text
              key={`label-${i}`}
              x={getX(i)}
              y={padding.top + graphHeight + 25}
              fontSize="12"
              fill="currentColor"
              opacity="0.6"
              textAnchor="middle"
            >
              {d.month}
            </text>
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute bg-black text-white px-3 py-2 rounded-md text-sm font-medium shadow-lg pointer-events-none z-10 whitespace-nowrap"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y - 45}px`,
              transform: "translateX(-50%)",
            }}
          >
            {formatCRC(tooltipValue)}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black"></div>
          </div>
        )}
      </div>
    </div>
  );
}
