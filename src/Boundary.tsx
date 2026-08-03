import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * A blank screen is the worst thing this app can do.
 *
 * In a clinic there is no console open and nobody to read it. The doctor sees
 * white, has no idea whether the prescription was saved, and the queue does not
 * stop. So any crash must say, on screen, in plain words: what broke, that the
 * work is safe, and how to get moving again in one tap.
 *
 * Nothing is lost when this fires — every change to a prescription is written
 * to the database as it is made, not on print. Reloading resumes it.
 */
type Props = { children: ReactNode }
type State = { err: Error | null; where: string }

export class Boundary extends Component<Props, State> {
  state: State = { err: null, where: '' }

  static getDerivedStateFromError(err: Error): Partial<State> {
    return { err }
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    this.setState({ where: (info.componentStack || '').split('\n').slice(1, 4).join('\n').trim() })
    // kept for the founders, not the doctor
    console.error('[nuskho] crash', err, info.componentStack)
  }

  render() {
    const { err, where } = this.state
    if (!err) return this.props.children
    return (
      <div className="crash">
        <h1>Something in the app broke</h1>
        <p className="lead">
          The prescription is <b>not lost</b>. Everything you tapped was saved as you tapped it.
          Reload and open the same patient from the queue — it will be exactly where you left it.
        </p>
        <div className="crash-acts">
          <button className="btn wide" onClick={() => location.reload()}>
            Reload and carry on &nbsp; ٻيهر کوليو
          </button>
        </div>
        <p className="hint">
          If it breaks again on the same patient, take a photo of this screen and send it to us —
          the lines below say where it happened.
        </p>
        <pre className="crash-tech">{err.message}{where ? '\n' + where : ''}</pre>
      </div>
    )
  }
}
