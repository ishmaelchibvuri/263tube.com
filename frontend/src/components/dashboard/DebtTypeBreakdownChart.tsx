"use client";

import { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { Debt } from "@/types";

interface DebtTypeBreakdownChartProps {
  debts: Debt[];
}

export function DebtTypeBreakdownChart({ debts }: DebtTypeBreakdownChartProps) {
  const chartRef = useRef<am5.Root | null>(null);
  const chartDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debts.length === 0 || !chartDivRef.current) return;

    // Create root element
    const root = am5.Root.new(chartDivRef.current);
    chartRef.current = root;

    // Remove AMCharts watermark
    root._logo?.dispose();

    // Set themes
    root.setThemes([am5themes_Animated.new(root)]);

    // Create chart with vertical layout for legend on bottom
    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
        radius: am5.percent(95),
      })
    );

    // Create series
    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: "value",
        categoryField: "category",
        alignLabels: false,
      })
    );

    // Hide labels and ticks to prevent overlap
    series.labels.template.set("visible", false);
    series.ticks.template.set("visible", false);

    // Configure slices
    series.slices.template.setAll({
      strokeWidth: 2,
      stroke: am5.color(0xffffff),
      tooltipText: "[bold]{category}[/]\nR{value.formatNumber('#,###')}\n{valuePercentTotal.formatNumber('0.0')}% of total",
      cursorOverStyle: "pointer",
    });

    // Set colors
    series.get("colors")?.set("colors", [
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
    ]);

    // Add legend positioned at the bottom
    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.percent(50),
        x: am5.percent(50),
        marginTop: 20,
        layout: root.horizontalLayout,
      })
    );

    // Configure legend labels
    legend.labels.template.setAll({
      fontSize: 11,
      fontWeight: "400",
    });

    // Configure legend value labels
    legend.valueLabels.template.setAll({
      fontSize: 11,
      fontWeight: "500",
    });

    // Configure legend markers
    legend.markers.template.setAll({
      width: 12,
      height: 12,
    });

    // Aggregate debts by type
    const typeMap: { [key: string]: number } = {};
    debts.filter((d) => !d.paidOffAt && !d.isArchived).forEach((debt) => {
      const type = debt.debtType || "other";
      const label =
        type === "creditCard"
          ? "Credit Card"
          : type === "storeCard"
          ? "Store Card"
          : type === "personalLoan"
          ? "Personal Loan"
          : type === "shortTerm"
          ? "Short Term"
          : type.charAt(0).toUpperCase() + type.slice(1);

      if (!typeMap[label]) {
        typeMap[label] = 0;
      }
      typeMap[label] += debt.currentBalance;
    });

    const chartData = Object.entries(typeMap)
      .map(([category, value]) => ({
        category,
        value: Math.round(value),
      }))
      .sort((a, b) => b.value - a.value);

    series.data.setAll(chartData);

    // Set legend data AFTER series data is set
    legend.data.setAll(series.dataItems);

    // Make stuff animate on load
    series.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [debts]);

  if (debts.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-gray-400">
        <p className="text-sm">No debts to display</p>
      </div>
    );
  }

  return <div ref={chartDivRef} style={{ width: "100%", height: "450px" }}></div>;
}
