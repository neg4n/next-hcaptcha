import Document, { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head />
        <script src="https://js.hcaptcha.com/1/api.js" async defer />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
