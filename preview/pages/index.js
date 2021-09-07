import { useState } from 'react'
import fs from 'fs/promises'
import path from 'path'

export default function Home({ apiRoutes }) {
  const [apiRoute, setApiRoute] = useState(apiRoutes[0])

  const handleChange = ({ target: { value: selectedApiRoute } }) => {
    setApiRoute(selectedApiRoute)
  }

  return (
    <div
      style={{
        maxWidth: '55.6rem',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: '6rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <form action={`/api/${apiRoute}`} method="POST">
        <label htmlFor="api-routes" style={{ marginRight: '1rem' }}>
          Select API route
        </label>
        <select
          onChange={handleChange}
          onid="api-routes"
          style={{ marginBottom: '1rem', width: '100%' }}
        >
          {apiRoutes.map((route) => (
            <option key={route} value={route}>
              {route}
            </option>
          ))}
        </select>
        <div
          style={{ display: 'flex', flexDirection: 'column' }}
          className="h-captcha"
          data-sitekey={`${process.env.NEXT_PUBLIC_HCAPTCHA_SITE}`}
        >
          HCaptcha
        </div>
        <br />
        <input type="submit" value="Submit" style={{ width: '100%' }} />
      </form>
    </div>
  )
}

export async function getStaticProps() {
  const apiRoutes = await fs.readdir(path.resolve('pages/api'))
  return {
    props: {
      apiRoutes: apiRoutes.map((route) => route.replace('.js', '')),
    },
  }
}
