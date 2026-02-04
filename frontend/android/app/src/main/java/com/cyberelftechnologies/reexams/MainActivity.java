package com.cyberelftechnologies.reexams;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.graphics.Color;
import android.widget.FrameLayout;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configure status bar - Keep content BELOW the status bar (not behind it)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            // Set status bar to blue/purple gradient color to match app theme
            // Using blue-600 (#2563EB) from the app's gradient theme
            getWindow().setStatusBarColor(Color.parseColor("#2563EB"));

            // Make status bar icons light/white (visible on dark background)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                View decorView = getWindow().getDecorView();
                // Clear the LIGHT_STATUS_BAR flag to show white icons
                int flags = decorView.getSystemUiVisibility();
                flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                decorView.setSystemUiVisibility(flags);
            }

            // Ensure content fits within system windows (starts below status bar)
            WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        }

        // Configure WebView settings immediately
        configureWebView();
    }

    @Override
    public void onStart() {
        super.onStart();

        // Reapply WebView configuration to ensure it persists
        configureWebView();

        // Add top padding to push content below status bar
        addWebViewPadding();
    }

    @Override
    public void onResume() {
        super.onResume();

        // Reapply zoom on resume to ensure it persists
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().setInitialScale(50);
        }

        // Ensure padding is applied
        addWebViewPadding();
    }

    private void addWebViewPadding() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();

            // Add significant top padding (100dp converted to pixels)
            int paddingTopDp = 80;
            float density = getResources().getDisplayMetrics().density;
            int paddingTopPx = (int) (paddingTopDp * density);

            // Set padding on the WebView
            webView.setPadding(0, paddingTopPx, 0, 0);

            // Also inject CSS to add padding to the body
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onProgressChanged(WebView view, int newProgress) {
                    super.onProgressChanged(view, newProgress);
                    if (newProgress == 100) {
                        // Page loaded, inject CSS for top padding
                        String javascript = "javascript:(function() { " +
                            "var style = document.createElement('style'); " +
                            "style.innerHTML = 'body { padding-top: 80px !important; }'; " +
                            "document.head.appendChild(style); " +
                            "})()";
                        view.loadUrl(javascript);
                    }
                }
            });
        }
    }

    private void configureWebView() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            WebSettings webSettings = webView.getSettings();

            // Enable viewport meta tag support
            webSettings.setUseWideViewPort(true);
            webSettings.setLoadWithOverviewMode(true);

            // Enable zoom controls
            webSettings.setBuiltInZoomControls(true);
            webSettings.setDisplayZoomControls(false); // Hide zoom controls UI
            webSettings.setSupportZoom(true);

            // Enable JavaScript (needed for CSS injection)
            webSettings.setJavaScriptEnabled(true);

            // Set initial scale to 50% (0.5 zoom)
            webView.setInitialScale(50);
        }
    }
}
