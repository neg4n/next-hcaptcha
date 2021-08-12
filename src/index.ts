import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'

type NextHCaptchaOptions = {
  envVarNames?: { secret: string }
}

type HCaptchaPayload = {
  secret: string
  response: string
}

type HCaptchaVerifyResponse = {
  success: boolean
  'error-codes': string | string[]
}

const HCAPTCHA_VERIFY_URL = 'https://hcaptcha.com/siteverify'

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

export function withHCaptcha(
  handler: NextApiHandler,
  options: NextHCaptchaOptions = {
    envVarNames: { secret: 'HCAPTCHA_SECRET' },
  },
) {
  const { envVarNames } = options
  return async (request: NextApiRequest, response: NextApiResponse) => {
    if (!process.env[envVarNames.secret] || process.env[envVarNames.secret] === '') {
      throw new Error(
        `${HCAPTCHA_ERRORS['missing-input-secret']} This must be done by providing ${envVarNames.secret} environment variable.`,
      )
    }

    const {
      'g-recaptcha-response': recaptchaResponse = null,
      'h-captcha-response': hcaptchaResponse = null,
    } = request.body

    if (!recaptchaResponse && !hcaptchaResponse) {
      response.json({
        success: false,
        message: HCAPTCHA_ERRORS['missing-input-response'],
      })
      response.end()
      return
    }

    const payload: HCaptchaPayload = {
      secret: process.env.HCAPTCHA_SECRET,
      response: recaptchaResponse || hcaptchaResponse,
    }

    const hcaptchaVerifyResponse = await fetch(HCAPTCHA_VERIFY_URL, {
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
