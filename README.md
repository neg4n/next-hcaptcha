# Next.js HCaptcha

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

Configuration is done by passing options object as second `withHCaptcha` argument.

Default options with all properties explained:

```js
const defaultOptions = {
  // HCaptcha token verification url. Read more at https://docs.hcaptcha.com/#verify-the-user-response-server-side
  captchaVerifyUrl: 'https://hcaptcha.com/siteverify',
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

`next-hcaptcha` informs about errors as described in the [official HCaptcha docs][hcaptcha-docs-errors] with some (i believe) tweaks.

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

