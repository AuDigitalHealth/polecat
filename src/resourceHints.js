import list from './img/list.svg'
import listActive from './img/list-active.svg'
import clipboard from './img/clipboard.svg'
import clipboardActive from './img/clipboard-active.svg'
import tick from './img/tick.svg'
import spinner from './img/spinner.svg'

const addResourceHint = hint => {
  const { rel, href, as, type } = hint
  const link = document.createElement('link')
  link.rel = rel
  link.href = href
  link.as = as
  link.type = type
  document.head.appendChild(link)
}

const preloadSvg = [ list, listActive, clipboard, clipboardActive, tick, spinner ]

const addResourceHints = () => {
  for (const svg of preloadSvg) {
    addResourceHint({
      href: svg,
      rel: 'prefetch',
      as: 'image',
      type: 'image/svg+xml',
    })
  }
}

export default addResourceHints
