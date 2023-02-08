import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'

export class NextHCaptchaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NextHCaptchaError'
  }
}

type NextHCaptchaOpt = {
  captchaVerifyUrl: string
  passRequestIpAddress: boolean
  skipCaptchaRequestsOptimization: boolean
  exceptions: boolean
  cleanInterception: boolean
  errorDisplayMode: 'code' | 'message'
  forwardCaptchaResponse: boolean
  enterprise: {
    scoreThreshold: number | null
  }
  envVarNames: { secret: string }
}

export type NextHCaptchaOptions = Partial<NextHCaptchaOpt>

type HCaptchaPayload = {
  secret: string
  response: string
  remoteip?: string
}

type HCaptchaVerifyError = string | string[]

type HCaptchaVerifyResponse = {
  success: boolean
  challenge_ts: string
  hostname: string
  credit?: boolean
  'error-codes'?: HCaptchaVerifyError
  score?: number
  score_reason?: string[]
}

export type NextApiRequestWithHCaptcha = NextApiRequest &
  Partial<{
    hcaptcha: HCaptchaVerifyResponse
  }>

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
  const defaultOptions: NextHCaptchaOpt = {
    captchaVerifyUrl: 'https://hcaptcha.com/siteverify',
    passRequestIpAddress: false,
    skipCaptchaRequestsOptimization: false,
    exceptions: false,
    cleanInterception: true,
    errorDisplayMode: 'message',
    forwardCaptchaResponse: false,
    enterprise: {
      scoreThreshold: null,
    },
    envVarNames: { secret: 'HCAPTCHA_SECRET' },
  }

  const mergedOptions: NextHCaptchaOpt = { ...defaultOptions, ...options }

  const {
    captchaVerifyUrl,
    passRequestIpAddress,
    skipCaptchaRequestsOptimization,
    exceptions,
    cleanInterception,
    errorDisplayMode,
    forwardCaptchaResponse,
    enterprise: { scoreThreshold },
    envVarNames,
  } = mergedOptions

  return async (request: NextApiRequestWithHCaptcha, response: NextApiResponse) => {
    const secret = process.env[envVarNames.secret] as string

    if (!skipCaptchaRequestsOptimization && (!secret || secret === '')) {
      throw new NextHCaptchaError(
        `${HCAPTCHA_ERRORS['missing-input-secret']} This must be done by providing ${envVarNames.secret} environment variable.`,
      )
    }

    const {
      'g-recaptcha-response': recaptchaResponse = null,
      'h-captcha-response': hcaptchaResponse = null,
    } = request.body

    if (!skipCaptchaRequestsOptimization && !recaptchaResponse && !hcaptchaResponse) {
      if (exceptions) {
        throw new NextHCaptchaError(HCAPTCHA_ERRORS['missing-input-response'])
      }

      response.json({
        success: false,
        message: HCAPTCHA_ERRORS['missing-input-response'],
      })
      response.end()
      return
    }

    if (cleanInterception) {
      delete request.body['g-recaptcha-response']
      delete request.body['h-captcha-response']
    }

    const requestIpAddress = (request.headers['cf-connecting-ip'] ||
      request.headers['x-forwarded-for'] ||
      request.socket.remoteAddress) as string

    const payload: HCaptchaPayload = {
      secret,
      response: recaptchaResponse || hcaptchaResponse,
      ...(passRequestIpAddress ? { remoteip: requestIpAddress } : null),
    }

    if (passRequestIpAddress && !requestIpAddress) {
      throw new NextHCaptchaError(
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
      throw new NextHCaptchaError('Unknown error has occurred.')
    }

    const hcaptchaVerifyResponseJson = await hcaptchaVerifyResponse.json()

    const {
      success,
      'error-codes': error,
      score,
    }: HCaptchaVerifyResponse = hcaptchaVerifyResponseJson

    if (!score && scoreThreshold) {
      throw new NextHCaptchaError(
        'Score threshold was set but no score was returned from HCaptcha response. This is possibly caused by not having enterprise key. Either unset enterprise.scoreThreshold or inspect your HCaptcha keys.',
      )
    }

    if (!success) {
      const errorObject = {
        ...(errorDisplayMode === 'code' && { 'error-codes': error }),
        ...(errorDisplayMode === 'message' && {
          message: Array.isArray(error)
            ? error.map((error) => HCAPTCHA_ERRORS[error])
            : HCAPTCHA_ERRORS[error!],
        }),
      }

      if (exceptions) {
        throw new NextHCaptchaError(errorObject.message || errorObject['error-codes'])
      }

      response.json({
        success,
        ...errorObject,
      })
      response.end()
      return
    }

    if (score && scoreThreshold) {
      if (score > scoreThreshold) {
        if (exceptions) {
          throw new NextHCaptchaError(
            `Score does not met specified (${scoreThreshold}) threshold.`,
          )
        }
        response.json({
          success: false,
          message: `Score does not met specified (${scoreThreshold}) threshold.`,
        })
        response.end()
        return
      }
    }

    if (forwardCaptchaResponse) {
      request.hcaptcha = hcaptchaVerifyResponseJson
    }

    return handler(request, response)
  }
}
