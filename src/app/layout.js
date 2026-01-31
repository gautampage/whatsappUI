"use client";
import { LoaderProvider } from "../middleware/loader.context";
import { NotiSnackbarProvider } from "../middleware/snackbar.context";
import Providers from "../middleware/store.context";
import ErrorBoundary from "./error-boundary";
import "./globals.css";

export default function RootLayout({ children }) {
  console.log("root loaded");
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=0.5" />
        <title>FIBE - WhatsApp</title>
        <link rel="icon" href="https://www.fibe.in/fibe-india.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="https://www.fibe.in/fibe-india.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="https://www.fibe.in/fibe-india.svg" />
      </head>
      <body
        className={"overflow-y-hidden"}
        data-testid="global-body"
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale"
        }}
      >
        <ErrorBoundary>
          <Providers>
            <LoaderProvider>
              <NotiSnackbarProvider>
                <div id="portal-root" />
                {children}
              </NotiSnackbarProvider>
            </LoaderProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
