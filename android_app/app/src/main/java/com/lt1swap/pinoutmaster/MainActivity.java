package com.lt1swap.pinoutmaster;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.HapticFeedbackConstants;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        window.setStatusBarColor(Color.parseColor("#0B0D12"));
        window.setNavigationBarColor(Color.parseColor("#11141C"));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#0B0D12"));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        webView.clearCache(true);
        webView.addJavascriptInterface(new AndroidBridge(this), "AndroidBridge");
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
    }

    public static class HapticRunner implements Runnable {
        private final MainActivity activity;
        public HapticRunner(MainActivity activity) {
            this.activity = activity;
        }
        @Override
        public void run() {
            if (activity.webView != null) {
                activity.webView.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
            }
        }
    }

    public static class ShareRunner implements Runnable {
        private final MainActivity activity;
        private final String title;
        private final String content;
        public ShareRunner(MainActivity activity, String title, String content) {
            this.activity = activity;
            this.title = title;
            this.content = content;
        }
        @Override
        public void run() {
            Intent sendIntent = new Intent();
            sendIntent.setAction(Intent.ACTION_SEND);
            sendIntent.putExtra(Intent.EXTRA_SUBJECT, title);
            sendIntent.putExtra(Intent.EXTRA_TEXT, content);
            sendIntent.setType("text/plain");
            Intent shareIntent = Intent.createChooser(sendIntent, title);
            activity.startActivity(shareIntent);
        }
    }

    public static class ExitRunner implements Runnable {
        private final MainActivity activity;
        public ExitRunner(MainActivity activity) {
            this.activity = activity;
        }
        @Override
        public void run() {
            activity.finishBack();
        }
    }

    public static class AndroidBridge {
        private final MainActivity activity;
        public AndroidBridge(MainActivity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void hapticTap() {
            activity.runOnUiThread(new HapticRunner(activity));
        }

        @JavascriptInterface
        public void shareText(final String title, final String content) {
            activity.runOnUiThread(new ShareRunner(activity, title, content));
        }

        @JavascriptInterface
        public void exitApp() {
            activity.runOnUiThread(new ExitRunner(activity));
        }
    }

    public void finishBack() {
        super.onBackPressed();
    }

    @Override
    public void onBackPressed() {
        if (webView != null) {
            webView.evaluateJavascript("if(!window.handleAndroidBack || !window.handleAndroidBack()){ if(window.AndroidBridge && window.AndroidBridge.exitApp) window.AndroidBridge.exitApp(); }", null);
        } else {
            super.onBackPressed();
        }
    }
}
