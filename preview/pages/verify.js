export default function VerifyPage() {
  async function handleSubmit(event) {
    event.preventDefault();
    console.log(event);
  }

  return (
    <>
      <form action="/api/hello" method="POST" >
        <div
          style={{ display: "flex", flexDirection: "column" }}
          className="h-captcha"
          data-sitekey={`${process.env.NEXT_PUBLIC_HCAPTCHA_SITE}`}
        >
          HCaptcha
        </div>
        <br />
        <input type="submit" value="Submit" />
      </form>
    </>
  );
}
