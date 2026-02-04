"use client";

import { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { PaymentRecord } from "@/types";
import { format, parseISO } from "date-fns";

interface PaymentHistoryChartProps {
  payments: PaymentRecord[];
}

export function PaymentHistoryChart({ payments }: PaymentHistoryChartProps) {
  const chartRef = useRef<am5.Root | null>(null);
  const chartDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (payments.length === 0 || !chartDivRef.current) return;

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
        panX: true,
        panY: true,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true,
      })
    );

    // Add cursor
    const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineY.set("visible", false);

    // Create axes
    const xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        maxDeviation: 0.2,
        baseInterval: {
          timeUnit: "day",
          count: 1,
        },
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {}),
      })
    );

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
      })
    );

    // Add series
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Payments",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "amount",
        valueXField: "date",
        tooltip: am5.Tooltip.new(root, {
          labelText: "R{valueY}\n{paymentDate}",
        }),
      })
    );

    series.columns.template.setAll({
      cornerRadiusTL: 5,
      cornerRadiusTR: 5,
      strokeOpacity: 0,
      fill: am5.color(0x10b981), // green
    });

    // Prepare data - aggregate by month
    const monthlyData: { [key: string]: number } = {};
    payments.forEach((payment) => {
      const monthKey = format(parseISO(payment.paymentDate), "yyyy-MM");
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += payment.amount;
    });

    const chartData = Object.entries(monthlyData)
      .map(([month, amount]) => ({
        date: new Date(month + "-01").getTime(),
        amount: Math.round(amount * 100) / 100,
        paymentDate: format(new Date(month + "-01"), "MMM yyyy"),
      }))
      .sort((a, b) => a.date - b.date);

    series.data.setAll(chartData);

    // Make stuff animate on load
    series.appear(1000);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [payments]);

  if (payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-400">
        <p className="text-sm">No payment history yet</p>
      </div>
    );
  }

  return <div ref={chartDivRef} style={{ width: "100%", height: "300px" }}></div>;
}
