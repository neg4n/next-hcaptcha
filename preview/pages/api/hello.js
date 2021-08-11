import { withHCaptcha } from "next-hcaptcha";

export default withHCaptcha((req, res) => {
  res.status(200).json({ name: "John Doe" });
});
