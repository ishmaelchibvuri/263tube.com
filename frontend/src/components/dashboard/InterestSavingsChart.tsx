"use client";

import { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

interface InterestSavingsChartProps {
  projectedInterestMinimum: number;
  projectedInterestStrategy: number;
  interestSaved: number;
}

export function InterestSavingsChart({
  projectedInterestMinimum,
  projectedInterestStrategy,
  interestSaved,
}: InterestSavingsChartProps) {
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
        layout: root.verticalLayout,
      })
    );

    // Create axes
    const xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 30 });
    xRenderer.labels.template.setAll({
      rotation: 0,
      centerY: am5.p50,
      centerX: am5.p50,
      paddingTop: 10,
    });

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "category",
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {}),
      })
    );

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        min: 0,
        renderer: am5xy.AxisRendererY.new(root, {}),
      })
    );

    // Add series
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Interest",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value",
        categoryXField: "category",
        tooltip: am5.Tooltip.new(root, {
          labelText: "R{valueY}",
        }),
      })
    );

    series.columns.template.setAll({
      cornerRadiusTL: 5,
      cornerRadiusTR: 5,
      strokeOpacity: 0,
    });

    // Color columns differently
    series.columns.template.adapters.add("fill", (fill, target) => {
      const category = (target.dataItem?.dataContext as any)?.category;
      if (category === "Minimum Payments") {
        return am5.color(0xef4444); // red
      } else if (category === "Your Strategy") {
        return am5.color(0x10b981); // green
      } else {
        return am5.color(0x3b82f6); // blue
      }
    });

    // Prepare data
    const chartData = [
      {
        category: "Minimum Payments",
        value: Math.round(projectedInterestMinimum),
      },
      {
        category: "Your Strategy",
        value: Math.round(projectedInterestStrategy),
      },
      {
        category: "You Save",
        value: Math.round(interestSaved),
      },
    ];

    xAxis.data.setAll(chartData);
    series.data.setAll(chartData);

    // Add legend
    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.percent(50),
        x: am5.percent(50),
      })
    );

    // Make stuff animate on load
    series.appear(1000);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [projectedInterestMinimum, projectedInterestStrategy, interestSaved]);

  return <div ref={chartDivRef} style={{ width: "100%", height: "300px" }}></div>;
}
