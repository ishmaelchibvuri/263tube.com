"use client";

import { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

interface IncomeVsExpensesChartProps {
  totalIncome: number;
  needsTotal: number;
  wantsTotal: number;
  savingsTotal: number;
  availableBalance: number;
}

export function IncomeVsExpensesChart({
  totalIncome,
  needsTotal,
  wantsTotal,
  savingsTotal,
  availableBalance,
}: IncomeVsExpensesChartProps) {
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
        paddingLeft: 0,
        paddingRight: 10,
      })
    );

    // Create Y-axis (categories)
    const yAxis = chart.yAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "category",
        renderer: am5xy.AxisRendererY.new(root, {
          minGridDistance: 20,
          cellStartLocation: 0.15,
          cellEndLocation: 0.85,
        }),
      })
    );

    yAxis.get("renderer").labels.template.setAll({
      fontSize: 12,
      fontWeight: "500",
      fill: am5.color(0x374151),
    });

    yAxis.get("renderer").grid.template.setAll({
      visible: false,
    });

    // Create X-axis (values)
    const xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 60,
        }),
        min: 0,
        max: totalIncome * 1.1, // 10% padding
      })
    );

    xAxis.get("renderer").labels.template.setAll({
      fontSize: 11,
      fill: am5.color(0x6b7280),
    });

    xAxis.get("renderer").grid.template.setAll({
      strokeOpacity: 0.1,
    });

    // Create series
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Amount",
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
      cornerRadiusTR: 6,
      cornerRadiusBR: 6,
      height: am5.percent(60),
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
          fontSize: 11,
          fontWeight: "600",
          paddingRight: 10,
        }),
      });
    });

    // Prepare data - order: Available at bottom, Income at top
    const chartData = [
      { category: "Available", value: Math.abs(availableBalance) },
      { category: "Savings", value: savingsTotal },
      { category: "Wants", value: wantsTotal },
      { category: "Needs", value: needsTotal },
      { category: "Income", value: totalIncome },
    ];

    // Set colors per data index (matching chartData order)
    const colorList = [
      availableBalance >= 0 ? am5.color(0x10b981) : am5.color(0xef4444), // Available: emerald or red
      am5.color(0x059669), // Savings: emerald-600
      am5.color(0xa855f7), // Wants: purple-500
      am5.color(0x3b82f6), // Needs: blue-500
      am5.color(0x22c55e), // Income: green-500
    ];

    series.columns.template.adapters.add("fill", (fill, target) => {
      const dataItem = target.dataItem;
      if (dataItem) {
        const index = series.dataItems.indexOf(dataItem);
        return colorList[index] || fill;
      }
      return fill;
    });

    yAxis.data.setAll(chartData);
    series.data.setAll(chartData);

    // Play initial series animation
    series.appear(1000);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [totalIncome, needsTotal, wantsTotal, savingsTotal, availableBalance]);

  return <div ref={chartDivRef} style={{ width: "100%", height: "280px" }}></div>;
}
