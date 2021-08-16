import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'

export type NextHCaptchaOptions = Partial<{
  captchaVerifyUrl: string
  passRequestIpAddress: boolean
  skipCaptchaRequestsOptimization: boolean
  envVarNames: { secret: string }
}>

type HCaptchaPayload = {
  secret: string
  response: string
  remoteip?: string
}

type HCaptchaVerifyResponse = {
  success: boolean
  'error-codes': string | string[]
}

const HCAPTCHA_ERRORS = {
  'missing-input-secret': 'Your secret key is missing.',
  'invalid-input-secret': 'Your secret key is invalid or malformed.',
  'missing-input-response': 'The response parameter (verification token) is missing.',
  'invalid-input-response':
    'The response parameter (verification token) is invalid or malformed.',
  'bad-request': 'The request is invalid or malformed.',
  'invalid-or-already-seen-response':
    'The response parameter has already been checked, or has another issue.',
  'not-using-dummy-passcode':
    'You have used a testing sitekey but have not used its matching secret.',
  'sitekey-secret-mismatch': 'The sitekey is not registered with the provided secret.',
}

export function withHCaptcha(handler: NextApiHandler, options: NextHCaptchaOptions = {}) {
  const defaultOptions: NextHCaptchaOptions = {
    captchaVerifyUrl: 'https://hcaptcha.com/siteverify',
    passRequestIpAddress: false,
    skipCaptchaRequestsOptimization: false,
    envVarNames: { secret: 'HCAPTCHA_SECRET' },
  }

  options = { ...defaultOptions, ...options }

  const {
    captchaVerifyUrl,
    passRequestIpAddress,
    skipCaptchaRequestsOptimization,
    envVarNames,
  } = options

  return async (request: NextApiRequest, response: NextApiResponse) => {
    if (
      !skipCaptchaRequestsOptimization &&
      (!process.env[envVarNames.secret] || process.env[envVarNames.secret] === '')
    ) {
      throw new Error(
        `${HCAPTCHA_ERRORS['missing-input-secret']} This must be done by providing ${envVarNames.secret} environment variable.`,
      )
    }

    const {
      'g-recaptcha-response': recaptchaResponse = null,
      'h-captcha-response': hcaptchaResponse = null,
    } = request.body

    if (!skipCaptchaRequestsOptimization && !recaptchaResponse && !hcaptchaResponse) {
      response.json({
        success: false,
        message: HCAPTCHA_ERRORS['missing-input-response'],
      })
      response.end()
      return
    }

    const requestIpAddress = (request.headers['cf-connecting-ip'] ||
      request.headers['x-forwarded-for'] ||
      request.socket.remoteAddress) as string

    const payload: HCaptchaPayload = {
      secret: process.env.HCAPTCHA_SECRET,
      response: recaptchaResponse || hcaptchaResponse,
      ...(passRequestIpAddress ? { remoteip: requestIpAddress } : null),
    }

    if (passRequestIpAddress && !requestIpAddress) {
      throw new Error(
        'Could not resolve request ip address. Check if your reverse proxy is configured properly or consider setting `passRequestIpAddress` to `false`. Find more at https://github.com/neg4n/next-hcaptcha#configuration',
      )
    }

    const hcaptchaVerifyResponse = await fetch(captchaVerifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(payload),
    })

    if (!hcaptchaVerifyResponse.ok) {
      throw new Error('Unknown error has occurred.')
    }

    const { success, 'error-codes': error }: HCaptchaVerifyResponse =
      await hcaptchaVerifyResponse.json()

    if (!success) {
      response.json({
        success,
        message: Array.isArray(error)
          ? error.map((error) => HCAPTCHA_ERRORS[error])
          : HCAPTCHA_ERRORS[error],
      })
      response.end()
      return
    }

    return handler(request, response)
  }
}
