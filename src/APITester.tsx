import { useRef, type FormEvent } from "react"
import './api-tester.css'

export function APITester() {
  const responseInputRef = useRef<HTMLTextAreaElement>(null)

  const testEndpoint = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const form = e.currentTarget
      const formData = new FormData(form)
      const endpoint = formData.get("endpoint") as string
      const url = new URL(endpoint, location.href)
      const method = formData.get("method") as string
      const res = await fetch(url, { method })

      const data = await res.json()
      responseInputRef.current!.value = JSON.stringify(data, null, 2)
    } catch (error) {
      responseInputRef.current!.value = String(error)
    }
  }

  return (
    <div className="api-tester-container">
      <form
        onSubmit={testEndpoint}
        className="api-tester-form"
      >
        <select
          name="method"
          className="api-tester-method-select"
        >
          <option value="GET" className="api-tester-method-option">
            GET
          </option>
          <option value="PUT" className="api-tester-method-option">
            PUT
          </option>
        </select>
        <input
          type="text"
          name="endpoint"
          defaultValue="/api/hello"
          className="api-tester-endpoint-input"
          placeholder="/api/hello"
        />
        <button
          type="submit"
          className="api-tester-submit-button"
        >
          Send
        </button>
      </form>
      <textarea
        ref={responseInputRef}
        readOnly
        placeholder="Response will appear here..."
        className="api-tester-response-textarea"
      />
    </div>
  )
}
