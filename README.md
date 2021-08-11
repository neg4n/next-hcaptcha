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

`HCAPTCHA_SECRET` environment variable must be set in your [Next.js][next-homepage] project.

## Errors

`next-hcaptcha` informs about errors as described in the [official HCaptcha docs][hcaptcha-docs-errors] with some (i believe) tweaks.

1. Error messages (_descriptions_ in [docs][hcaptcha-docs-errors]) are shown directly instead of informing about the error code. This has purpose of improving overall work with the library and reduce eventual frustration caused by jumping between loads of documentation.

2. `missing-input-secret` is handled by the library before sending request to HCaptcha verification endpoint by checking sanity of `HCAPTCHA_SECRET` environment variable. and **results in runtime exception**.

3. `missing-input-response` is also handled by the library before sending request to HCaptcha verification endpoint and results in standard error respecting the first point.

## TODO

- [ ] Configuration 
- [ ] Better README 
- [ ] Tests 

## Ending speech

This project is licensed under the MIT license.  
All contributions are welcome.

[hcaptcha-docs-errors]: https://docs.hcaptcha.com/#siteverify-error-codes-table
[next-homepage]: https://nextjs.org/
[next-api-routes]: https://nextjs.org/docs/api-routes/introduction
