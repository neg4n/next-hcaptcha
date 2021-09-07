<div align="center">
  <h1>Next.js HCaptcha</h1>
  <br />
</div>

<div align="center">
  <a href="https://www.npmjs.com/package/next-hcaptcha"><img alt="npm version badge" src="https://badgen.net/npm/v/next-hcaptcha"></a>  
  <img alt="types information" src="https://badgen.net/npm/types/next-hcaptcha">
  <img alt="npm bundle size" src="https://badgen.net/bundlephobia/minzip/next-hcaptcha">
  <img alt="license badge" src="https://badgen.net/npm/license/next-hcaptcha">
  
</div>

<br />

## Introduction

This library provides simple higher order function  
with responsibility of _"guarding"_ specific [Next.js API route][next-api-routes].

Sample usage:

```js
import { withHCaptcha } from 'next-hcaptcha'

export default withHCaptcha((req, res) => {
  res.status(200).json({ name: 'John Doe' })
})
```

## Configuration

Configuration is done by passing options object as second `withHCaptcha` function call argument.

Default options with all properties explained:

```js
const defaultOptions = {
  // HCaptcha token verification url. Read more at
  // https://docs.hcaptcha.com/#verify-the-user-response-server-side
  captchaVerifyUrl: 'https://hcaptcha.com/siteverify',
  // Whether to pass request ip address or not
  // The ip resolving is done by checking cf-connecting-ip, x-forwarded-for headers
  // or evetually request.socket.remoteAddress property
  // (if the two mentioned earlier are undefined).
  passRequestIpAddress: false,
  // Whether to skip HCaptcha requests optimization or not.
  // Requests optimization are simple static checks if some
  // properties from the payload exist and if they are not empty.
  skipCaptchaRequestsOptimization: false,
  // Error display mode. If set to 'message', it will show error's descriptions
  // from https://docs.hcaptcha.com/#siteverify-error-codes-table. If set to 'code' it will
  // show the error code instead.
  errorDisplayMode: 'message',
  // Env vars names object. Key is type of env var and value is your custom name.
  // Value can be any string as long as it matches your .env* file.
  envVarNames: { secret: 'HCAPTCHA_SECRET' },
}
```

### Configuration sharing

Configuration sharing can be done by creating `next-hcaptcha.config.js` in root of your [Next.js][next-homepage] project and simply importing it and passing as argument in every (or specific) route(s).

`next-hcaptcha.config.js`

```js
const config = {
  // ...
}

export default config
```

`pages/api/your-route.js`

```js
import { withHCaptcha } from 'next-hcaptcha'
import config from '../../next-hcaptcha.config'

export default withHCaptcha((req, res) => {
  res.status(200).json({ name: 'John Doe' })
}, config)
```

## Errors

`next-hcaptcha` informs about errors as described in the [official HCaptcha docs][hcaptcha-docs-errors] with some _(i believe)_ tweaks.

**NOTE**: Error optimization described in point **2.** and **3.** can be disabled by setting `skipCaptchaRequestsOptimization` in configuration to `true` and way of informing about errors described in point **1.**
can be restored to traditional way by setting `errorDisplayMode` to `'code'`

1. Error messages (_descriptions_ in [docs][hcaptcha-docs-errors]) are shown directly instead of informing about the error code. This has purpose of improving overall work with the library and reduce eventual frustration caused by jumping between loads of documentation.

2. `missing-input-secret` is handled by the library before sending request to HCaptcha verification endpoint by checking sanity of `HCAPTCHA_SECRET` environment variable. and **results in runtime exception**.

3. `missing-input-response` is also handled by the library before sending request to HCaptcha verification endpoint and results in standard error respecting the first point.

## TODO

- [ ] Usage examples symlinked to `preview/pages/api/`
- [ ] Configuration
- [ ] Better README
- [ ] Tests

## Ending speech

This project is licensed under the MIT license.
All contributions are welcome.

[hcaptcha-docs-errors]: https://docs.hcaptcha.com/#siteverify-error-codes-table
[next-homepage]: https://nextjs.org/
[next-api-routes]: https://nextjs.org/docs/api-routes/introduction
