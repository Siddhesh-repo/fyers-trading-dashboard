import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, ColorType } from 'lightweight-charts';
import { BarChart2, AlertCircle } from 'lucide-react';

/**
 * Transforms API candle objects to TradingView Lightweight Charts format.
 * TradingView requires data items to have ascending, unique 'time' timestamps.
 */
const transformCandleData = (candles) => {
  if (!Array.isArray(candles) || candles.length === 0) return [];

  const timeMap = new Map();
  candles.forEach((item) => {
    if (
      item &&
      item.timestamp != null &&
      item.open != null &&
      item.high != null &&
      item.low != null &&
      item.close != null
    ) {
      const ts = Number(item.timestamp);
      timeMap.set(ts, {
        time: ts,
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
      });
    }
  });

  return Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
};

export const HistoricalChart = ({ candles = [], symbol = '', resolution = '' }) => {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [renderError, setRenderError] = useState(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    setRenderError(null);

    let chart = null;

    try {
      const containerWidth = chartContainerRef.current.clientWidth || 600;

      // Create TradingView Lightweight Chart instance
      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#0B0E14' },
          textColor: '#94A3B8',
          fontSize: 12,
          fontFamily: 'JetBrains Mono, Inter, sans-serif',
        },
        grid: {
          vertLines: { color: '#1E2433' },
          horzLines: { color: '#1E2433' },
        },
        crosshair: {
          mode: 1, // Normal crosshair
        },
        rightPriceScale: {
          borderColor: '#232936',
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        timeScale: {
          borderColor: '#232936',
          timeVisible: true,
          secondsVisible: false,
        },
        height: 380,
        width: containerWidth,
      });

      chartInstanceRef.current = chart;

      const seriesOptions = {
        upColor: '#10B981',
        downColor: '#EF4444',
        borderVisible: false,
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      };

      // Support lightweight-charts v5 API (addSeries) with fallback to v4 API (addCandlestickSeries)
      const candlestickSeries =
        typeof chart.addSeries === 'function' && CandlestickSeries
          ? chart.addSeries(CandlestickSeries, seriesOptions)
          : chart.addCandlestickSeries(seriesOptions);

      // Format & set data
      const formattedData = transformCandleData(candles);
      if (formattedData.length > 0) {
        candlestickSeries.setData(formattedData);
        chart.timeScale().fitContent();
      }
    } catch (err) {
      console.error('[HistoricalChart] Chart render error:', err);
      setRenderError(err.message || 'Failed to render chart');
    }

    // Auto-resize handler
    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        const newWidth = chartContainerRef.current.clientWidth;
        if (newWidth > 0) {
          chartInstanceRef.current.applyOptions({ width: newWidth });
        }
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    // Initial resize trigger after DOM reflow
    const timer = setTimeout(handleResize, 100);

    // Cleanup on unmount or re-render
    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.remove();
        } catch (e) {
          // ignore cleanup error
        }
        chartInstanceRef.current = null;
      }
    };
  }, [candles]);

  if (renderError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-[#0B0E14] border border-rose-500/20 rounded-xl text-rose-400 gap-2 p-4">
        <AlertCircle className="w-8 h-8" />
        <p className="text-xs font-semibold">Chart Error: {renderError}</p>
        <p className="text-[11px] text-slate-400">The candle table below displays all fetched records.</p>
      </div>
    );
  }

  if (!candles || candles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-[#0B0E14] border border-[#232936] rounded-xl text-slate-500 gap-2">
        <BarChart2 className="w-8 h-8 opacity-40" />
        <p className="text-xs">No chart data available for selected range.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="font-mono font-semibold text-slate-200">
          Candlestick Chart · {symbol} ({resolution})
        </span>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
          Live Interactive Chart
        </span>
      </div>
      <div
        ref={chartContainerRef}
        className="w-full rounded-xl border border-[#232936] overflow-hidden bg-[#0B0E14] shadow-inner"
      />
    </div>
  );
};
