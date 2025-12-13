import svgPaths from "./svg-ybscv0ilx3"
import './icon.css'

function Frame() {
  return (
    <div className="icon-frame" data-name="Frame">
      <div className="icon-frame-inner">
        <svg className="icon-svg" fill="none" preserveAspectRatio="none" viewBox="0 0 235 235">
          <g id="Frame">
            <path clipRule="evenodd" d={svgPaths.p28898e00} fillRule="evenodd" id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="21.3333" />
            <path d={svgPaths.p3a238100} id="Vector_2" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="21.3333" />
          </g>
        </svg>
      </div>
    </div>
  )
}

export default function Icon() {
  return (
    <div className="icon-container" data-name="Icon">
      <div className="icon-outer-flex">
        <div className="icon-inner-flex">
          <Frame />
        </div>
      </div>
    </div>
  )
}