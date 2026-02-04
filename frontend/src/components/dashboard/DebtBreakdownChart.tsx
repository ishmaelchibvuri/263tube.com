"use client";

import { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { Debt } from "@/types";

interface DebtBreakdownChartProps {
  debts: Debt[];
}

export function DebtBreakdownChart({ debts }: DebtBreakdownChartProps) {
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
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: "none",
        wheelY: "none",
        layout: root.verticalLayout,
      })
    );

    // Create Y-axis (categories)
    const yAxis = chart.yAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "category",
        renderer: am5xy.AxisRendererY.new(root, {
          minGridDistance: 10,
          cellStartLocation: 0.1,
          cellEndLocation: 0.9,
        }),
      })
    );

    yAxis.get("renderer").labels.template.setAll({
      fontSize: 10,
      oversizedBehavior: "wrap",
      maxWidth: 120,
      ellipsis: "...",
    });

    // Create X-axis (values)
    const xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererX.new(root, {}),
        min: 0,
      })
    );

    xAxis.get("renderer").labels.template.setAll({
      fontSize: 11,
    });

    // Create series
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Debt Balance",
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: "value",
        categoryYField: "category",
        tooltip: am5.Tooltip.new(root, {
          labelText: "[bold]{categoryY}[/]\nR{valueX.formatNumber('#,###')}",
        }),
      })
    );

    // Configure column appearance
    series.columns.template.setAll({
      strokeOpacity: 0,
      cornerRadiusTR: 5,
      cornerRadiusBR: 5,
      height: am5.percent(70),
      tooltipText: "[bold]{categoryY}[/]\nR{valueX.formatNumber('#,###')}",
    });

    // Add labels on bars
    series.bullets.push(() => {
      return am5.Bullet.new(root, {
        locationX: 1,
        sprite: am5.Label.new(root, {
          text: "R{valueX.formatNumber('#,###')}",
          fill: am5.color(0xffffff),
          centerY: am5.p50,
          centerX: am5.p100,
          populateText: true,
          fontSize: 10,
          fontWeight: "500",
          paddingRight: 8,
        }),
      });
    });

    // Set colors
    series.columns.template.adapters.add("fill", (fill, target) => {
      const colors = [
        am5.color(0x3b82f6), // blue
        am5.color(0x8b5cf6), // purple
        am5.color(0xec4899), // pink
        am5.color(0xf59e0b), // amber
        am5.color(0x10b981), // green
        am5.color(0x06b6d4), // cyan
        am5.color(0xef4444), // red
        am5.color(0x6366f1), // indigo
        am5.color(0x14b8a6), // teal
        am5.color(0xf97316), // orange
      ];
      const dataItem = target.dataItem;
      if (dataItem) {
        const index = series.dataItems.indexOf(dataItem);
        return colors[index % colors.length];
      }
      return fill;
    });

    // Prepare data - sort by value descending
    const chartData = debts
      .filter((d) => !d.paidOffAt && !d.isArchived)
      .map((debt) => ({
        category: debt.debtName,
        value: debt.currentBalance,
      }))
      .sort((a, b) => b.value - a.value);

    yAxis.data.setAll(chartData);
    series.data.setAll(chartData);

    // Play initial series animation
    series.appear(1000);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [debts]);

  return <div ref={chartDivRef} style={{ width: "100%", height: "500px" }}></div>;
}
