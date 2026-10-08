import './DevBanner.css'

/**
 * Per the project brief: "Do not hide mock data behind the appearance of
 * being live data." Every screen that reads from a Mock* backend service
 * renders this so mock vs. live is never ambiguous.
 */
export function DevBanner() {
  return (
    <div className="dev-banner" role="status">
      <i className="ph ph-flask" aria-hidden="true" />
      Mock data — AI engines and live feeds aren't connected yet
    </div>
  )
}
