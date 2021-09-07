import { withHCaptcha } from 'next-hcaptcha'

const config = {
  forwardCaptchaResponse: true,
}

export default withHCaptcha((req, res) => {
  res.status(200).json({ name: 'John Doe', hcaptcha: req.hcaptcha })
}, config)
