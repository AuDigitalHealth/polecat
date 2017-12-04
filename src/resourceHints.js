import { icons } from './Icon.js'

const addResourceHint = hint => {
  const { rel, href, as, type } = hint
  const link = document.createElement('link')
  link.rel = rel
  link.href = href
  link.as = as
  link.type = type
  document.head.appendChild(link)
}

const preloadSvg = Object.values(icons)

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
