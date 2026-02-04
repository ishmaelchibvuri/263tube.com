"use client";

import { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5radar from "@amcharts/amcharts5/radar";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

interface DebtProgressGaugeProps {
  debtsKilled: number;
  totalDebts: number;
}

export function DebtProgressGauge({ debtsKilled, totalDebts }: DebtProgressGaugeProps) {
  const chartRef = useRef<am5.Root | null>(null);
  const chartDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartDivRef.current) return;

    // Create root element
    const root = am5.Root.new(chartDivRef.current);
    chartRef.current = root;

    // Remove AMCharts watermark
    root._logo?.dispose();

    // Set themes
    root.setThemes([am5themes_Animated.new(root)]);

    // Create chart
    const chart = root.container.children.push(
      am5radar.RadarChart.new(root, {
        panX: false,
        panY: false,
        startAngle: 180,
        endAngle: 360,
      })
    );

    // Create axis
    const axisRenderer = am5radar.AxisRendererCircular.new(root, {
      innerRadius: -10,
      strokeOpacity: 1,
      strokeWidth: 15,
      strokeGradient: am5.LinearGradient.new(root, {
        rotation: 0,
        stops: [
          { color: am5.color(0xef4444) },
          { color: am5.color(0xf59e0b) },
          { color: am5.color(0x10b981) },
        ],
      }),
    });

    const xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        maxDeviation: 0,
        min: 0,
        max: 100,
        strictMinMax: true,
        renderer: axisRenderer,
      })
    );

    // Add clock hand
    const axisDataItem = xAxis.makeDataItem({});
    axisDataItem.set("value", 0);

    const hand = axisDataItem.set(
      "bullet",
      am5xy.AxisBullet.new(root, {
        sprite: am5radar.ClockHand.new(root, {
          radius: am5.percent(99),
          innerRadius: am5.percent(50),
          bottomWidth: 20,
          topWidth: 0,
        }),
      })
    );

    xAxis.createAxisRange(axisDataItem);

    // Calculate percentage
    const percentage = totalDebts > 0 ? Math.round((debtsKilled / totalDebts) * 100) : 0;

    // Animate the gauge hand
    axisDataItem.animate({
      key: "value",
      to: percentage,
      duration: 1000,
      easing: am5.ease.out(am5.ease.cubic),
    });

    return () => {
      root.dispose();
    };
  }, [debtsKilled, totalDebts]);

  return <div ref={chartDivRef} style={{ width: "100%", height: "250px" }}></div>;
}
